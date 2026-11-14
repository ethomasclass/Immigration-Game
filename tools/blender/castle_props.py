"""
Castle Garden hall furniture, modelled in Blender and placed from the game's own layout.

  python castle_props.py [preview|bake] [out_dir]

Reads castle_layout.json (exported from the game: the positions of benches, partitions,
counters, booths and stoves) and builds detailed models in the same places, in the style of
the depot engravings: paneled clerks' counters, low paneled partitions instead of pickets,
kiosk booths with sign frames, slatted benches on iron ends, pot-belly stoves.
The game keeps the collision boxes; this file only replaces what you see.
The bake here is deliberately light (few samples, small textures) for a quick look.
Game point (x, y, z) = Blender (x, -z, y). Game rotation.y = Blender rotation about Z.
"""
import bpy, bmesh, math, sys, os, json
from mathutils import Vector, Matrix

MODE = sys.argv[1] if len(sys.argv) > 1 else 'preview'
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else '.')
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
LAYOUT = json.load(open(os.path.join(HERE, 'castle_layout.json')))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene; col = scene.collection

def srgb(h):
    h = h.lstrip('#'); v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in v)

def mat_wood(name, hexc, grain=12.0, rough=0.45):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; n = nt.nodes; L = nt.links
    b = n['Principled BSDF']; b.inputs['Roughness'].default_value = rough
    tc = n.new('ShaderNodeTexCoord')
    wave = n.new('ShaderNodeTexWave'); wave.inputs['Scale'].default_value = grain; wave.inputs['Distortion'].default_value = 6; wave.inputs['Detail'].default_value = 4
    L.new(tc.outputs['Object'], wave.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB'); c = srgb(hexc)
    ramp.color_ramp.elements[0].color = (c[0] * 0.62, c[1] * 0.6, c[2] * 0.58, 1); ramp.color_ramp.elements[1].color = (*c, 1)
    L.new(wave.outputs['Fac'], ramp.inputs['Fac']); L.new(ramp.outputs['Color'], b.inputs['Base Color'])
    return m

def mat_flat(name, hexc, rough=0.6, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb(hexc), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    return m

WOOD = mat_wood('wood', '#6b4a2e'); WOOD_L = mat_wood('wood_light', '#8a6a46', 9); IRON = mat_flat('iron', '#1c1b1a', 0.5, 0.6)
PAPER = mat_flat('paper', '#e9e0c8', 0.9); BRASS = mat_flat('brass', '#b8913a', 0.35, 0.8); LEATHER = mat_flat('leather', '#3a2416', 0.7)

class Piece:
    """Collects boxes and cylinders in a piece's local frame (game axes: x along, y up, z back), then places it."""
    def __init__(self): self.bm = bmesh.new(); self.mats = []; self.idx = {}
    def _mi(self, m):
        if m.name not in self.idx: self.idx[m.name] = len(self.mats); self.mats.append(m)
        return self.idx[m.name]
    def _add(self, geom_verts, m):
        i = self._mi(m)
        for f in {f for v in geom_verts for f in v.link_faces}: f.material_index = i
    def box(self, cx, cy, cz, sx, sy, sz, m, tilt=0.0):
        r = bmesh.ops.create_cube(self.bm, size=1.0); vs = r['verts']
        bmesh.ops.scale(self.bm, vec=(sx, sz, sy), verts=vs)                      # (x, depth, height) in Blender local
        if tilt: bmesh.ops.rotate(self.bm, cent=(0, 0, 0), matrix=Matrix.Rotation(tilt, 3, 'X'), verts=vs)
        bmesh.ops.translate(self.bm, vec=(cx, -cz, cy), verts=vs); self._add(vs, m)
    def cyl(self, cx, cy, cz, r0, r1, h, m, seg=12):
        r = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r0, radius2=r1, depth=h); vs = r['verts']
        bmesh.ops.translate(self.bm, vec=(cx, -cz, cy), verts=vs); self._add(vs, m)
    def sphere(self, cx, cy, cz, r, m, sy=1.0):
        res = bmesh.ops.create_uvsphere(self.bm, u_segments=14, v_segments=8, radius=r); vs = res['verts']
        bmesh.ops.scale(self.bm, vec=(1, 1, sy), verts=vs); bmesh.ops.translate(self.bm, vec=(cx, -cz, cy), verts=vs); self._add(vs, m)
    def place(self, name, gx, gz, ry):
        me = bpy.data.meshes.new(name); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        ob = bpy.data.objects.new(name, me); col.objects.link(ob)
        ob.location = (gx, -gz, 0); ob.rotation_euler = (0, 0, ry); return ob

# ------------------------------------------------------------------ the pieces
def bench(p, w):
    for k, z in enumerate((-0.17, -0.04, 0.09)): p.box(0, 0.45, z, w, 0.035, 0.11, WOOD_L)          # seat slats
    for k, y in enumerate((0.62, 0.78)): p.box(0, y, 0.2, w, 0.09, 0.03, WOOD_L, tilt=-0.18)        # back slats
    for sx in (-w / 2 + 0.12, w / 2 - 0.12):                                                         # cast-iron ends
        p.box(sx, 0.22, -0.16, 0.04, 0.44, 0.05, IRON); p.box(sx, 0.4, 0.17, 0.04, 0.8, 0.05, IRON)
        p.box(sx, 0.43, 0.0, 0.04, 0.04, 0.42, IRON); p.box(sx, 0.03, 0.0, 0.04, 0.04, 0.42, IRON)

def panels(p, w, h, z, y0=0.12, t=0.03, bay=0.9, m=WOOD):
    """A paneled face: stiles, rails and raised panels, at local depth z (negative = front)."""
    n = max(1, round(w / bay)); bw = w / n
    p.box(0, y0 / 2, z, w, y0, t * 2, IRON if m is None else m)                                  # plinth
    p.box(0, h - 0.05, z, w, 0.1, t * 2, m); p.box(0, y0 + 0.05, z, w, 0.1, t * 2, m)          # top and bottom rails
    for i in range(n + 1): p.box(-w / 2 + i * bw, (h + y0) / 2, z, 0.08, h - y0, t * 2, m)       # stiles
    for i in range(n): p.box(-w / 2 + (i + 0.5) * bw, (h + y0) / 2, z - t * (1 if z < 0 else -1), bw - 0.2, h - y0 - 0.3, t, WOOD_L)   # raised panels

def counter(p, w, d, h):
    p.box(0, h / 2, 0, w - 0.04, h - 0.02, d - 0.06, WOOD)                                       # carcass
    panels(p, w, h - 0.06, -d / 2, m=WOOD); panels(p, d, h - 0.06, 0, m=WOOD) if False else None
    p.box(0, h + 0.025, 0, w + 0.14, 0.05, d + 0.16, WOOD_L)                                     # top, with an overhang
    p.box(0, h + 0.2, d / 2 - 0.08, w, 0.34, 0.06, WOOD)                                         # low back rail where the clerk writes
    for i, x in enumerate((-w / 3, 0.15, w / 3)):                                                # ledgers and an inkwell
        p.box(x, h + 0.08, 0.05, 0.42, 0.06 + 0.02 * i, 0.3, LEATHER); p.box(x, h + 0.115 + 0.02 * i, 0.05, 0.38, 0.005, 0.27, PAPER)
    p.cyl(w / 3 + 0.4, h + 0.08, -0.05, 0.045, 0.035, 0.07, IRON)

def booth(p, w, d):
    h, back = 1.05, 0.55
    p.box(0, h / 2, 0, w - 0.04, h, d - 0.06, WOOD); panels(p, w, h, -d / 2)
    p.box(0, h + 0.025, -0.05, w + 0.14, 0.05, d + 0.1, WOOD_L)
    for sx in (-w / 2, w / 2):
        for z in (-d / 2, back): p.box(sx, 1.45, z, 0.1, 2.9, 0.1, WOOD)                         # corner posts
        p.box(sx, 0.6, (back - d / 2) / 2 + 0.05, 0.05, 1.2, back + d / 2, WOOD)                   # low side panels
    p.box(0, 2.5, back + 0.06, w + 0.3, 0.75, 0.05, WOOD)                                         # board behind the painted sign
    p.box(0, 2.9, back + 0.06, w + 0.4, 0.08, 0.12, WOOD_L); p.box(0, 2.1, back + 0.06, w + 0.4, 0.06, 0.1, WOOD_L)   # frame mouldings
    p.box(0, 2.98, (back - d / 2) / 2, w + 0.5, 0.06, back + d / 2 + 0.4, WOOD)                    # little roof
    for i in range(3): p.box(-w / 3 + i * w / 3, h + 0.1, 0.05, 0.3, 0.12, 0.22, PAPER)           # papers on the counter

def partition(p, L):
    n = max(1, math.ceil(L / 1.4)); step = L / n
    for i in range(n + 1):                                                                         # turned posts with knobs
        x = -L / 2 + i * step; p.box(x, 0.6, 0, 0.1, 1.2, 0.1, WOOD); p.sphere(x, 1.25, 0, 0.065, WOOD_L)
    p.box(0, 1.12, 0, L, 0.07, 0.11, WOOD_L)                                                       # top rail
    for i in range(n): panels(p, step - 0.1, 0.95, 0, y0=0.1, t=0.02, bay=0.7) if False else None
    for i in range(n):
        cx = -L / 2 + (i + 0.5) * step
        p.box(cx, 0.55, 0, step - 0.1, 0.8, 0.04, WOOD)                                           # boarded panel
        p.box(cx, 0.55, -0.025, step - 0.36, 0.56, 0.02, WOOD_L); p.box(cx, 0.55, 0.025, step - 0.36, 0.56, 0.02, WOOD_L)

def stove(p):
    for k in range(3): a = k * 2 * math.pi / 3; p.box(math.sin(a) * 0.3, 0.12, math.cos(a) * 0.3, 0.06, 0.24, 0.06, IRON)
    p.cyl(0, 0.27, 0, 0.42, 0.42, 0.08, IRON, 16); p.sphere(0, 0.72, 0, 0.42, IRON, 1.15)
    p.cyl(0, 1.18, 0, 0.3, 0.22, 0.2, IRON, 16); p.cyl(0, 1.32, 0, 0.26, 0.26, 0.06, BRASS, 16)
    p.cyl(0, 4.2, 0, 0.08, 0.08, 5.8, IRON, 10); p.box(0, 0.62, -0.4, 0.22, 0.16, 0.04, BRASS)

objs = {}
for i, s in enumerate(LAYOUT):
    p = Piece(); k = s['kind']
    if k == 'bench': bench(p, s.get('w', 1.6)); ob = p.place(f'bench{i}', s['x'], s['z'], s['ry'])
    elif k == 'counter': counter(p, s['w'], s['d'], s['h']); ob = p.place(f'counter{i}', s['x'], s['z'], s['ry'] + math.pi)   # paneled front faces the people in line
    elif k == 'booth': booth(p, s['w'], s['d']); ob = p.place(f'booth{i}', s['x'], s['z'], s['ry'])
    elif k == 'stove': stove(p); ob = p.place(f'stove{i}', s['x'], s['z'], 0)
    elif k == 'partition':
        L = math.hypot(s['x1'] - s['x0'], s['z1'] - s['z0']); partition(p, L)
        ob = p.place(f'partition{i}', (s['x0'] + s['x1']) / 2, (s['z0'] + s['z1']) / 2, -math.atan2(s['z1'] - s['z0'], s['x1'] - s['x0']))
    objs.setdefault(k, []).append(ob)

# join each kind into one object (one texture each when baked)
joined = []
for k, lst in objs.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in lst: o.select_set(True)
    bpy.context.view_layer.objects.active = lst[0]; bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = k; joined.append(o)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ------------------------------------------------------------------ the hall around them, for light and shadow (not exported)
shell_path = os.path.join(ROOT, 'assets', 'models', 'castle_interior.glb')
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=shell_path)
shell = [o for o in bpy.data.objects if o not in before]
G = lambda x, y, z: Vector((x, -z, y))
sun_dir = (G(0, 0, 0) - G(-30, 50, 40)).normalized()
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 5.5; sun.angle = math.radians(1.5); sun.color = (1.0, 0.94, 0.84)
so = bpy.data.objects.new('sun', sun); col.objects.link(so); so.rotation_euler = sun_dir.to_track_quat('-Z', 'Y').to_euler()
world = bpy.data.worlds.new('sky'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*srgb('#c9ccd0'), 1); bg.inputs['Strength'].default_value = 1.2
fill = bpy.data.lights.new('fill', 'AREA'); fill.energy = 2600; fill.size = 20
fo = bpy.data.objects.new('fill', fill); fo.location = G(0, 17.5, 0); col.objects.link(fo)
for (x, y, z) in [(-8, 6, 8), (8, 6, -8), (0, 7.5, 0)]:
    l = bpy.data.lights.new('gas', 'POINT'); l.energy = 450; l.color = (1.0, 0.8, 0.55)
    lo = bpy.data.objects.new('gas', l); lo.location = G(x, y, z); col.objects.link(lo)

scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.use_denoising = True; scene.view_settings.view_transform = 'Standard'

if MODE == 'preview':
    cam = bpy.data.cameras.new('cam'); cam.lens = 18
    co = bpy.data.objects.new('cam', cam); col.objects.link(co); scene.camera = co
    eye, look = (G(*map(float, os.environ['EYE'].split(','))), G(*map(float, os.environ['LOOK'].split(',')))) if os.environ.get('EYE') else (G(6, 2.2, 22), G(-2, 1.0, 4))
    co.location = eye; co.rotation_euler = (look - eye).to_track_quat('-Z', 'Y').to_euler()
    scene.cycles.samples = 32; scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.render.filepath = os.path.join(OUT, 'props_preview.png'); bpy.ops.render.render(write_still=True)
    print('wrote', scene.render.filepath); sys.exit(0)

# ------------------------------------------------------------------ a light bake (quick look), then export
scene.cycles.samples = 16; scene.render.bake.margin = 4
SIZES = {'bench': 512, 'partition': 512, 'counter': 512, 'booth': 512, 'stove': 256}
for ob in joined:
    uv = ob.data.uv_layers.new(name='bake'); ob.data.uv_layers.active = uv
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.003); bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new(ob.name + '_baked', SIZES.get(ob.name, 512), SIZES.get(ob.name, 512))
    for m in ob.data.materials:
        nd = m.node_tree.nodes.new('ShaderNodeTexImage'); nd.image = img; m.node_tree.nodes.active = nd
    print('baking', ob.name, flush=True); bpy.ops.object.bake(type='COMBINED')
    m = bpy.data.materials.new(ob.name + '_mat'); m.use_nodes = True
    t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = img
    m.node_tree.links.new(t.outputs['Color'], m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    ob.data.materials.clear(); ob.data.materials.append(m)
    for l in list(ob.data.uv_layers):
        if l.name != 'bake': ob.data.uv_layers.remove(l)
bpy.ops.object.select_all(action='DESELECT')
for ob in joined: ob.select_set(True)
path = os.path.join(OUT, 'castle_props.glb')
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                          export_image_format='WEBP', export_image_quality=82, export_lights=False, export_cameras=False)
print('wrote', path, os.path.getsize(path) // 1024, 'KB')
