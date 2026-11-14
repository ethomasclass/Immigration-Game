"""
Castle Garden rotunda, modelled and light-baked in Blender for the game.

  python castle_interior.py [preview|bake] [out_dir]

  preview : renders a still from inside (to check the look quickly)
  bake    : bakes light and shadow into textures and exports castle_interior.glb

Matches js/zones/castle.js: R=35 (outer), RI=32.6 (inner face), H=13, lantern ring DR=12.5,
upper gallery at 5.6 m, 3.4 m deep. Modelled on the 1860s-80s engravings of the depot interior.
Blender is Z-up; the game is Y-up. Game point (x, y, z) = Blender (x, -z, y).
Requires the `bpy` package (Blender as a Python module).
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix

MODE = sys.argv[1] if len(sys.argv) > 1 else 'preview'
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else '.')
QUICK = os.environ.get('QUICK') == '1'

R, T = 35.0, 2.4
RI, H = R - T, 13.0
GAL_Y, GAL_D = 5.6, 3.4
CH0, CH1 = math.pi * 0.625, math.pi * 0.875
DR = 12.5
rim, rise = R + 0.6, 6.0
Rs = (rim * rim + rise * rise) / (2 * rise)
th, th0 = math.asin(rim / Rs), math.asin(DR / Rs)
roofY = H + 0.2 + rise - Rs
drumY = roofY + math.sqrt(Rs * Rs - DR * DR)
drumH = 3.2

def G(x, y, z):            # game -> blender
    return Vector((x, -z, y))
def pt(a, r):              # game angle (0 = +Z, toward +X) -> game x, z
    return math.sin(a) * r, math.cos(a) * r

# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection

def new_obj(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob); return ob

def apply_bool(ob, cutters, op='DIFFERENCE'):
    for c in cutters:
        m = ob.modifiers.new('b', 'BOOLEAN'); m.operation = op; m.object = c; m.solver = 'EXACT'
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.clear(); old = ob.data; ob.data = me; bpy.data.meshes.remove(old)
    me.materials.clear()                       # cutters leave empty slots behind
    for p in me.polygons: p.material_index = 0
    for c in cutters: bpy.data.objects.remove(c)

def box(name, center, size, rot_z=0.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rot_z, 3, 'Z'), verts=bm.verts)
    bmesh.ops.translate(bm, vec=center, verts=bm.verts)
    return new_obj(name, bm)

def ring_solid(name, r_in, r_out, z0, z1, seg=128):
    """A thick vertical ring (tube) between two radii."""
    bm = bmesh.new()
    def circle(r, z):
        return [bm.verts.new((math.cos(2 * math.pi * i / seg) * r, math.sin(2 * math.pi * i / seg) * r, z)) for i in range(seg)]
    oi, oo, ti, to = circle(r_in, z0), circle(r_out, z0), circle(r_in, z1), circle(r_out, z1)
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new((oi[i], ti[i], ti[j], oi[j]))          # inner face (faces the centre)
        bm.faces.new((oo[i], oo[j], to[j], to[i]))          # outer
        bm.faces.new((ti[i], to[i], to[j], ti[j]))          # top
        bm.faces.new((oi[i], oi[j], oo[j], oo[i]))          # bottom
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, bm)

def cone(name, r0, r1, h, center, seg=16, cap=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=r0, radius2=r1, depth=h)
    bmesh.ops.translate(bm, vec=center, verts=bm.verts)
    return new_obj(name, bm)

# ------------------------------------------------------------------ materials (procedural detail that the bake captures)
def mat_brick(name, c1, c2, mortar, brick_w, brick_h, coord='cyl', radius=RI, mortar_size=0.015, bias=0.0, rough=0.9):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; n = nt.nodes; L = nt.links
    bsdf = n['Principled BSDF']; bsdf.inputs['Roughness'].default_value = rough
    tc = n.new('ShaderNodeTexCoord'); sep = n.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
    comb = n.new('ShaderNodeCombineXYZ')
    if coord == 'cyl':      # unrolled wall: around the circle, and up
        at = n.new('ShaderNodeMath'); at.operation = 'ARCTAN2'; L.new(sep.outputs['Y'], at.inputs[0]); L.new(sep.outputs['X'], at.inputs[1])
        mul = n.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = radius; L.new(at.outputs[0], mul.inputs[0])
        L.new(mul.outputs[0], comb.inputs['X']); L.new(sep.outputs['Z'], comb.inputs['Y'])
    elif coord == 'radial':  # dome boards: around, and outward
        at = n.new('ShaderNodeMath'); at.operation = 'ARCTAN2'; L.new(sep.outputs['Y'], at.inputs[0]); L.new(sep.outputs['X'], at.inputs[1])
        mul = n.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 18.0; L.new(at.outputs[0], mul.inputs[0])
        vl = n.new('ShaderNodeVectorMath'); vl.operation = 'LENGTH'
        cxy = n.new('ShaderNodeCombineXYZ'); L.new(sep.outputs['X'], cxy.inputs['X']); L.new(sep.outputs['Y'], cxy.inputs['Y']); L.new(cxy.outputs[0], vl.inputs[0])
        L.new(vl.outputs['Value'], comb.inputs['X']); L.new(mul.outputs[0], comb.inputs['Y'])
    else:                    # flat floor boards
        L.new(sep.outputs['X'], comb.inputs['X']); L.new(sep.outputs['Y'], comb.inputs['Y'])
    br = n.new('ShaderNodeTexBrick')
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1); br.inputs['Mortar'].default_value = (*mortar, 1)
    br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = mortar_size; br.inputs['Bias'].default_value = bias
    br.inputs['Brick Width'].default_value = brick_w; br.inputs['Row Height'].default_value = brick_h
    L.new(comb.outputs[0], br.inputs['Vector'])
    # grime: large soft noise darkens the colours a little
    nz = n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.6; L.new(comb.outputs[0], nz.inputs['Vector'])
    mix = n.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 0.35
    L.new(br.outputs['Color'], mix.inputs['A']); L.new(nz.outputs['Color'], mix.inputs['B'])
    L.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    bump = n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.35; L.new(br.outputs['Fac'], bump.inputs['Height']); L.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return m

def mat_flat(name, c, rough=0.8, emit=None, strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*c, 1); b.inputs['Roughness'].default_value = rough
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    return m

def srgb(h):
    h = h.lstrip('#'); v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in v)

M_WALL = mat_brick('wall', srgb('#9a7e66'), srgb('#7f6650'), srgb('#5e4c3c'), 1.1, 0.42, 'cyl', RI, 0.025, 0.1)
M_FLOOR = mat_brick('floor', srgb('#b49a78'), srgb('#a08462'), srgb('#6a5440'), 3.2, 0.22, 'flat', mortar_size=0.008, bias=0.2, rough=0.7)
M_DOME = mat_brick('dome', srgb('#7a6a58'), srgb('#6a5a48'), srgb('#3a2e24'), 3.0, 0.24, 'radial', mortar_size=0.01, rough=0.85)
M_PAINT = mat_flat('paint', srgb('#ddd6c4'), 0.6)
M_PLASTER = mat_flat('plaster', srgb('#e8dfc8'), 0.9)
M_STONE = mat_flat('stone', srgb('#8a8070'), 0.8)
M_GLASS = mat_flat('glass', srgb('#cfd8d8'), 0.2, srgb('#dfe6e2'), 2.5)
M_SKY = mat_flat('skylight', srgb('#efece2'), 0.5, srgb('#f4f1e6'), 3.0)   # glazed lantern ceiling: daylight through it

# ------------------------------------------------------------------ the rotunda
objs = []
# floor
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, radius=RI + 0.05, segments=96)
floor = new_obj('floor', bm); floor.data.materials.append(M_FLOOR); objs.append(floor)

# inner wall: a ring 1.4 m thick (the game's outer sandstone wall stays as it is), with the two doorways and the old gun ports
wall = ring_solid('wall', RI, RI + 1.4, 0, H)
cut = []
for (a0, a1) in [(-0.075, 0.075)]:
    a = (a0 + a1) / 2; x, z = pt(a, RI + 0.7)
    cut.append(box('door_w', G(x, 2.0, z), (2 * (RI + 0.7) * math.sin((a1 - a0) / 2) + 0.4, 4.0, H + 2), rot_z=a))
# landward side: open between CH0 and CH1 (the straight wall with the exit door is part of the game's outer shell)
for k in range(10):
    a = CH0 - 0.02 + (CH1 - CH0 + 0.04) * (k + 0.5) / 10; x, z = pt(a, RI + 0.7)
    cut.append(box('land', G(x, H / 2, z), (2 * (RI + 0.7) * math.sin((CH1 - CH0 + 0.04) / 20) + 0.6, 4.0, H + 2), rot_z=a))
win_angles = [a for a in [0.25 + i * 0.28 for i in range(23)] if not (CH0 - 0.05 < a < CH1 + 0.05) and a < 2 * math.pi - 0.1]
for a in win_angles:
    x, z = pt(a, RI + 0.7)
    cut.append(box('win', G(x, 3.0, z), (1.1, 4.0, 1.5), rot_z=a))
# upper arcade: tall round-headed windows all round, above the gallery
arc_angles = [a for a in [(i + 0.5) * 2 * math.pi / 44 for i in range(44)] if not (CH0 - 0.05 < a < CH1 + 0.05)]
for a in arc_angles:
    x, z = pt(a, RI + 0.7)
    cut.append(box('arc', G(x, GAL_Y + 2.7, z), (1.7, 4.0, 3.4), rot_z=a))
    c = cone('arch_top', 0.85, 0.85, 4.0, G(x, GAL_Y + 4.4, z), seg=14); c.rotation_euler = (math.pi / 2, 0, a)
    bpy.context.view_layer.update(); c.data.transform(c.matrix_world); c.matrix_world = Matrix.Identity(4)
    cut.append(c)
apply_bool(wall, cut)
wall.data.materials.append(M_WALL); objs.append(wall)
# glass at the back of each gun port, so the openings glow
for a in win_angles:
    x, z = pt(a, RI + 1.35)
    g = box('pane', G(x, 3.0, z), (1.1, 0.04, 1.5), rot_z=a); g.data.materials.append(M_GLASS); objs.append(g)
for a in arc_angles:
    x, z = pt(a, RI + 1.35)
    g = box('pane', G(x, GAL_Y + 3.0, z), (1.7, 0.04, 4.6), rot_z=a); g.data.materials.append(M_GLASS); objs.append(g)

# ---- the upper gallery: plank floor slab, posts, a railing with balusters and small arched brackets
GR = RI - GAL_D
gal = ring_solid('gallery', GR, RI + 0.05, GAL_Y - 0.3, GAL_Y, seg=144); gal.data.materials.append(M_DOME); objs.append(gal)
gparts = []
def post_ok(a): return not (CH0 - 0.06 < a < CH1 + 0.06) and not (abs(a) < 0.1 or abs(a - 2 * math.pi) < 0.1)
posts = [(i + 0.5) * 2 * math.pi / 40 for i in range(40)]
for a in posts:
    if not post_ok(a): continue
    x, z = pt(a, GR + 0.15)
    gparts.append(cone('gpost', 0.13, 0.11, GAL_Y - 0.3, G(x, (GAL_Y - 0.3) / 2, z), seg=10))
    gparts.append(cone('gcap', 0.11, 0.3, 0.45, G(x, GAL_Y - 0.52, z), seg=10))
def tube(name, pts, r):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 1
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for k, v in enumerate(pts): sp.points[k].co = (*v, 1)
    ob = bpy.data.objects.new(name, cu); col.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); bpy.data.objects.remove(ob)
    o2 = bpy.data.objects.new(name + 'm', me); col.objects.link(o2); return o2
for a0 in posts:                      # shallow arched bracket under the slab between posts
    a1 = a0 + 2 * math.pi / 40
    if not (post_ok(a0) and post_ok(a1)): continue
    pts = []
    for k in range(9):
        t = k / 8; a = a0 + (a1 - a0) * t; x, z = pt(a, GR + 0.15)
        pts.append(G(x, GAL_Y - 0.35 - 0.55 * (1 - math.sin(math.pi * t)), z))
    gparts.append(tube('gbr', pts, 0.06))
rail_pts = [G(*((lambda q: (q[0], GAL_Y + 1.0, q[1]))(pt(2 * math.pi * k / 180, GR + 0.1)))) for k in range(181)]
gparts.append(tube('grail', rail_pts, 0.05))
for k in range(0, 360):
    a = 2 * math.pi * k / 360
    if not post_ok(a) and not (CH0 - 0.06 < a < CH1 + 0.06): continue
    x, z = pt(a, GR + 0.1)
    gparts.append(box('bal', G(x, GAL_Y + 0.5, z), (0.035, 0.035, 1.0)))
for p in gparts: p.data.materials.clear(); p.data.materials.append(M_PAINT)
bpy.ops.object.select_all(action='DESELECT')
for p in gparts: p.select_set(True)
bpy.context.view_layer.objects.active = gparts[0]; bpy.ops.object.join()
gal_iron = bpy.context.view_layer.objects.active; gal_iron.name = 'gallery_iron'; objs.append(gal_iron)

# low domed roof: an annulus of a sphere, with thickness so both sides bake
bm = bmesh.new()
segs, rings = 96, 10
rows = []
for j in range(rings + 1):
    t = th0 + (th - th0) * j / rings
    r, z = Rs * math.sin(t), roofY + Rs * math.cos(t)
    rows.append([bm.verts.new((math.cos(2 * math.pi * i / segs) * r, math.sin(2 * math.pi * i / segs) * r, z)) for i in range(segs)])
for j in range(rings):
    for i in range(segs):
        k = (i + 1) % segs
        bm.faces.new((rows[j][i], rows[j][k], rows[j + 1][k], rows[j + 1][i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
dome = new_obj('dome', bm)
sol = dome.modifiers.new('s', 'SOLIDIFY'); sol.thickness = 0.18
dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(dome.evaluated_get(dg)); dome.modifiers.clear(); dome.data = me
dome.data.materials.append(M_DOME); objs.append(dome)
ribs = []
for i in range(36):                     # timber ribs under the roof, radiating from the lantern
    a = 2 * math.pi * i / 36; pts = []
    for j in range(12):
        t_ = th0 + (th - th0) * j / 11; r, zz = (Rs - 0.12) * math.sin(t_), roofY + (Rs - 0.12) * math.cos(t_)
        pts.append(Vector((math.cos(a) * r, math.sin(a) * r, zz)))
    cu = bpy.data.curves.new('drib', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.11; cu.bevel_resolution = 1
    sp = cu.splines.new('POLY'); sp.points.add(11)
    for k, v in enumerate(pts): sp.points[k].co = (*v, 1)
    ob = bpy.data.objects.new('drib', cu); col.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); bpy.data.objects.remove(ob)
    o2 = bpy.data.objects.new('dribm', me); col.objects.link(o2); o2.data.materials.append(M_PAINT); ribs.append(o2)
bpy.ops.object.select_all(action='DESELECT')
for p in ribs: p.select_set(True)
bpy.context.view_layer.objects.active = ribs[0]; bpy.ops.object.join()
dribs = bpy.context.view_layer.objects.active; dribs.name = 'dome_ribs'; objs.append(dribs)

# clerestory drum: a ring with tall arched windows, open to the sky so light pours down
drum = ring_solid('drum', DR - 0.12, DR + 0.12, drumY - 0.05, drumY + drumH, seg=96)
cut = []
for i in range(24):
    a = (i + 0.5) * 2 * math.pi / 24; x, z = pt(a, DR)
    cut.append(box('cw', G(x, drumY + 1.25, z), (0.95, 1.0, 1.7), rot_z=a))
    c = cone('ca', 0.475, 0.475, 1.0, G(x, drumY + 2.1, z), seg=12); c.rotation_euler = (math.pi / 2, 0, a); 
    dg = bpy.context.evaluated_depsgraph_get(); bpy.context.view_layer.update()
    c.data.transform(c.matrix_world); c.matrix_world = Matrix.Identity(4)
    cut.append(c)
apply_bool(drum, cut)
drum.data.materials.append(M_PLASTER); objs.append(drum)
# lantern roof and its ceiling
lc = cone('lantern', DR + 0.8, 0.0, 2.6, G(0, drumY + drumH + 1.3, 0), seg=48, cap=False)   # no bottom cap: it would sit exactly on the ceiling
lc.data.materials.append(M_DOME); objs.append(lc)
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, radius=DR + 0.1, segments=48); bmesh.ops.translate(bm, vec=G(0, drumY + drumH, 0), verts=bm.verts)
bmesh.ops.reverse_faces(bm, faces=bm.faces)
ceil = new_obj('lantern_ceiling', bm); ceil.data.materials.append(M_SKY); objs.append(ceil)

# twelve slender iron columns with flared capitals, arched braces and a ring beam
cy = drumY
parts = []
for i in range(12):
    a = math.pi / 12 + i * math.pi * 2 / 12; x, z = pt(a, DR)
    parts.append(cone('shaft', 0.26, 0.2, cy - 3.0, G(x, (cy - 3.0) / 2, z), seg=12))
    parts.append(cone('collar', 0.26, 0.26, 0.3, G(x, cy - 3.0, z), seg=12))
    for r_ in range(10):                  # palm-frond capital: ten ribs curling out and up to the ring
        ra = 2 * math.pi * r_ / 10
        pts = []
        for k in range(10):
            t = k / 9; rr = 0.2 + 2.3 * (1 - math.cos(t * math.pi / 2)); up = 2.95 * math.sin(t * math.pi / 2)
            pts.append(G(x + math.sin(ra) * rr, cy - 3.0 + up, z + math.cos(ra) * rr))
        rib = bpy.data.curves.new('rib', 'CURVE'); rib.dimensions = '3D'; rib.bevel_depth = 0.07; rib.bevel_resolution = 1
        spr = rib.splines.new('POLY'); spr.points.add(9)
        for k, v in enumerate(pts): spr.points[k].co = (*v, 1)
        ro = bpy.data.objects.new('rib', rib); col.objects.link(ro)
        dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ro.evaluated_get(dg)); bpy.data.objects.remove(ro)
        r2 = bpy.data.objects.new('ribm', me); col.objects.link(r2); parts.append(r2)
    parts.append(cone('base', 0.4, 0.34, 0.5, G(x, 0.25, z), seg=12))
    # arched brace to the next column: a bent tube
    a2 = a + math.pi * 2 / 12; x2, z2 = pt(a2, DR)
    mx, mz, span = (x + x2) / 2, (z + z2) / 2, math.hypot(x2 - x, z2 - z)
    bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=False, radius=1.0, segments=2)
    bm.free()
    curve = bpy.data.curves.new('arch', 'CURVE'); curve.dimensions = '3D'; curve.bevel_depth = 0.1; curve.bevel_resolution = 2
    sp = curve.splines.new('POLY'); n = 14; sp.points.add(n - 1)
    for k in range(n):
        t = k / (n - 1); px, pz = x + (x2 - x) * t, z + (z2 - z) * t
        drop = 1.25 * (1 - math.sin(math.pi * t))           # arch rises to the middle
        v = G(px * 0.985, cy - 1.35 - (1.25 - drop) * 0 - drop * 0.9 + 1.25 * 0.0, pz * 0.985)
        sp.points[k].co = (*v, 1)
    ob = bpy.data.objects.new('arch', curve); col.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); bpy.data.objects.remove(ob)
    ob2 = bpy.data.objects.new('archm', me); col.objects.link(ob2); parts.append(ob2)
beam = bpy.data.curves.new('beam', 'CURVE'); beam.dimensions = '3D'; beam.bevel_depth = 0.2; beam.bevel_resolution = 2
sp = beam.splines.new('POLY'); sp.points.add(63); sp.use_cyclic_u = True
for k in range(64):
    a = 2 * math.pi * k / 64; x, z = pt(a, DR); sp.points[k].co = (*G(x, cy - 0.05, z), 1)
bo = bpy.data.objects.new('beam', beam); col.objects.link(bo)
dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(bo.evaluated_get(dg)); bpy.data.objects.remove(bo)
bo2 = bpy.data.objects.new('beamm', me); col.objects.link(bo2); parts.append(bo2)
# join all column parts into one object
for p in parts: p.data.materials.append(M_PAINT)
bpy.ops.object.select_all(action='DESELECT')
for p in parts: p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
columns = bpy.context.view_layer.objects.active; columns.name = 'columns'; objs.append(columns)

# ------------------------------------------------------------------ light: an October afternoon
sun_dir = (G(0, 0, 0) - G(-30, 50, 40)).normalized()
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 5.5; sun.angle = math.radians(1.5); sun.color = (1.0, 0.94, 0.84)
so = bpy.data.objects.new('sun', sun); col.objects.link(so)
so.rotation_euler = sun_dir.to_track_quat('-Z', 'Y').to_euler()
world = bpy.data.worlds.new('sky'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*srgb('#c9ccd0'), 1); bg.inputs['Strength'].default_value = 1.2
for (x, y, z) in [(-8, 6, 8), (8, 6, -8), (0, 7.5, 0)]:       # the three gas lamps in the game
    l = bpy.data.lights.new('gas', 'POINT'); l.energy = 450; l.color = (1.0, 0.8, 0.55); l.shadow_soft_size = 0.3
    lo = bpy.data.objects.new('gas', l); lo.location = G(x, y, z); col.objects.link(lo)
# the straight landward wall (with the exit door) as in the game, and a soft fill light under the lantern (not exported)
ax, az = pt(CH0, R * 0.995); bx, bz = pt(CH1, R * 0.995)
mx, mz = (ax + bx) / 2, (az + bz) / 2; L_ = math.hypot(bx - ax, bz - az); ang = math.atan2(-(bz - az), bx - ax)
sw = box('straight', G(mx, H / 2, mz), (L_, 2.4, H), rot_z=ang)
apply_bool(sw, [box('exit', G(mx, 1.5, mz), (3.6, 4.0, 3.0), rot_z=ang)])
sw.data.materials.append(mat_flat('sand2', srgb('#a08872')))
fill = bpy.data.lights.new('fill', 'AREA'); fill.energy = 1400; fill.size = 16; fill.color = (1.0, 0.98, 0.94)
fo = bpy.data.objects.new('fill', fill); fo.location = G(0, drumY - 0.3, 0); col.objects.link(fo)   # daylight falling from the lantern
# the game's outer sandstone shell and ground, so light and shadow from outside are right (not exported)
shell = ring_solid('shell', R - 0.6, R, 0, H, seg=96); shell.data.materials.append(mat_flat('sand', srgb('#8a5a44')))
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, radius=200, segments=32); bmesh.ops.translate(bm, vec=(0, 0, -0.05), verts=bm.verts)
ground = new_obj('ground', bm); ground.data.materials.append(mat_flat('ground', srgb('#7d776c')))

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.use_denoising = True
scene.view_settings.view_transform = 'Standard'

if MODE == 'none':
    pass
elif MODE == 'preview':
    cam = bpy.data.cameras.new('cam'); cam.lens = 16
    co = bpy.data.objects.new('cam', cam); col.objects.link(co); scene.camera = co
    eye, look = G(5, 1.7, 28), G(-3, 6.5, 0)
    co.location = eye; co.rotation_euler = (look - eye).to_track_quat('-Z', 'Y').to_euler()
    scene.cycles.samples = 24 if QUICK else 96
    scene.render.resolution_x, scene.render.resolution_y = (960, 540) if QUICK else (1280, 720)
    scene.render.filepath = os.path.join(OUT, 'blender_preview.png')
    bpy.ops.render.render(write_still=True)
    print('wrote', scene.render.filepath)
    sys.exit(0)

if MODE != 'bake':
    sys.exit(0)
# ------------------------------------------------------------------ bake light into textures, export for the game
SIZES = {'floor': 2048, 'wall': 2048, 'dome': 1024, 'drum': 1024, 'lantern': 512, 'lantern_ceiling': 512, 'columns': 1024, 'gallery': 1024, 'gallery_iron': 1024, 'dome_ribs': 512}
scene.cycles.samples = 24 if QUICK else 128
scene.render.bake.margin = 6
baked = []
for ob in objs:
    if ob.name.startswith('pane'): continue
    size = SIZES.get(ob.name, 512) // (2 if QUICK else 1)
    uv = ob.data.uv_layers.new(name='bake'); ob.data.uv_layers.active = uv
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004)
    bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new(ob.name + '_baked', size, size)
    for m in ob.data.materials:
        node = m.node_tree.nodes.new('ShaderNodeTexImage'); node.image = img; m.node_tree.nodes.active = node
    print('baking', ob.name, size, flush=True)
    bpy.ops.object.bake(type='COMBINED')
    baked.append((ob, img))
# swap each material for a plain baked one (the game draws these unlit)
for ob, img in baked:
    m = bpy.data.materials.new(ob.name + '_mat'); m.use_nodes = True
    t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = img
    m.node_tree.links.new(t.outputs['Color'], m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    ob.data.materials.clear(); ob.data.materials.append(m)
    # keep only the bake UVs
    for l in list(ob.data.uv_layers):
        if l.name != 'bake': ob.data.uv_layers.remove(l)
bpy.ops.object.select_all(action='DESELECT')
for ob in objs: ob.select_set(True)
path = os.path.join(OUT, 'castle_interior.glb')
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                          export_image_format='WEBP', export_image_quality=82, export_materials='EXPORT', export_lights=False, export_cameras=False)
print('wrote', path, os.path.getsize(path) // 1024, 'KB')
