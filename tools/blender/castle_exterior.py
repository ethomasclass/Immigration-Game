"""
Castle Garden: everything outside the rotunda shell and furniture, remodelled in Blender.

  python castle_exterior.py [preview|bake] [out_dir]        (env EYE / LOOK = "x,y,z" game coords for preview)

Reads castle_scene.json, the list of everything the game builds for this chapter (exported with
dev.sceneLayout()), and builds a detailed version of each piece in the same place:
  fort wall with real gun ports and coping, the straight landward wall, the Commissioners' office
  block, clapboard outbuildings with shingled roofs, brick buildings on State Street with real window
  recesses, trees, pavilions, benches, luggage, the barge and tug, and every post, rail and fence.
The bake is light (quick look). Game point (x, y, z) = Blender (x, -z, y).
"""
import bpy, bmesh, math, sys, os, json, random
from mathutils import Vector, Matrix

MODE = sys.argv[1] if len(sys.argv) > 1 else 'preview'
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else '.')
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SCENE = json.load(open(os.path.join(HERE, 'castle_scene.json')))
rnd = random.Random(1888)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene; col = scene.collection
G = lambda x, y, z: Vector((x, -z, y))

def srgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in v)

# ------------------------------------------------------------------ materials
MATS = {}
def node_mat(name, build):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; build(m.node_tree); MATS[name] = m; return m

def courses(nt, c1, c2, mortar, bw, bh, ms=0.02, axis='XZ', rough=0.85, bump=0.3, noise=0.35, bias=0.0):
    """Brick/board/stone courses in object space. axis picks the two world axes the pattern runs along."""
    n, L = nt.nodes, nt.links; b = n['Principled BSDF']; b.inputs['Roughness'].default_value = rough
    tc = n.new('ShaderNodeTexCoord'); sep = n.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
    comb = n.new('ShaderNodeCombineXYZ')
    if axis == 'XZ':   # walls facing any way: use x+y (along) and z (up)
        add = n.new('ShaderNodeMath'); add.operation = 'ADD'; L.new(sep.outputs['X'], add.inputs[0]); L.new(sep.outputs['Y'], add.inputs[1])
        L.new(add.outputs[0], comb.inputs['X']); L.new(sep.outputs['Z'], comb.inputs['Y'])
    elif axis == 'ZX':  # vertical boards: up becomes "along"
        add = n.new('ShaderNodeMath'); add.operation = 'ADD'; L.new(sep.outputs['X'], add.inputs[0]); L.new(sep.outputs['Y'], add.inputs[1])
        L.new(sep.outputs['Z'], comb.inputs['X']); L.new(add.outputs[0], comb.inputs['Y'])
    else:               # flat: x and y
        L.new(sep.outputs['X'], comb.inputs['X']); L.new(sep.outputs['Y'], comb.inputs['Y'])
    br = n.new('ShaderNodeTexBrick')
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1); br.inputs['Mortar'].default_value = (*mortar, 1)
    br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = ms; br.inputs['Brick Width'].default_value = bw; br.inputs['Row Height'].default_value = bh; br.inputs['Bias'].default_value = bias
    L.new(comb.outputs[0], br.inputs['Vector'])
    nz = n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.8; L.new(comb.outputs[0], nz.inputs['Vector'])
    mix = n.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = noise
    L.new(br.outputs['Color'], mix.inputs['A']); L.new(nz.outputs['Color'], mix.inputs['B']); L.new(mix.outputs['Result'], b.inputs['Base Color'])
    bp = n.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; L.new(br.outputs['Fac'], bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])

def flat(name, hexc, rough=0.7, metal=0.0, emit=None):
    def bld(nt):
        b = nt.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*srgb(hexc), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
        if emit: b.inputs['Emission Color'].default_value = (*srgb(emit), 1); b.inputs['Emission Strength'].default_value = 1.5
    return node_mat(name, bld)

SAND = node_mat('sandstone', lambda nt: courses(nt, srgb('#8e5c45'), srgb('#7a4c39'), srgb('#5a3a2c'), 1.2, 0.45, 0.025))
GRANITE = node_mat('granite', lambda nt: courses(nt, srgb('#9c9a94'), srgb('#86847e'), srgb('#5e5c58'), 1.4, 0.5, 0.02))
CLAP = lambda hexc: node_mat('clap_' + hexc, lambda nt: courses(nt, srgb(hexc), tuple(c * 0.9 for c in srgb(hexc)), tuple(c * 0.55 for c in srgb(hexc)), 6.0, 0.2, 0.012, bump=0.5, noise=0.25, bias=0.5))
SHINGLE = node_mat('shingle', lambda nt: courses(nt, srgb('#5a5650'), srgb('#4a4640'), srgb('#2a2824'), 0.35, 0.22, 0.03, axis='XZ', bump=0.6))
FENCE = node_mat('fence', lambda nt: courses(nt, srgb('#8a8478'), srgb('#76706a'), srgb('#3e3a36'), 6.0, 0.16, 0.012, axis='ZX', bump=0.5, bias=0.5))
PLANK = node_mat('planks', lambda nt: courses(nt, srgb('#6e5a40'), srgb('#5e4a32'), srgb('#2e2418'), 3.0, 0.2, 0.01, axis='XY'))
WOOD_D = node_mat('wood_dark', lambda nt: courses(nt, srgb('#4a3826'), srgb('#3e2e20'), srgb('#24180e'), 2.5, 0.15, 0.006, axis='ZX', noise=0.3))
STUDDED = node_mat('studded', lambda nt: courses(nt, srgb('#3a2e26'), srgb('#30251e'), srgb('#151010'), 4.0, 0.22, 0.02, axis='ZX', bump=0.7))
IRON = flat('iron', '#1d1c1b', 0.5, 0.7); WHITE = flat('paint_white', '#e6e0d0', 0.6); BRASS = flat('brass', '#b8913a', 0.35, 0.8)
GLASS = flat('glass', '#2a3036', 0.15, 0.2); GLASS_LIT = flat('glass_lit', '#cfc8a8', 0.3, emit='#e8d9a8'); TRIM = flat('trim', '#d8d0bc', 0.6)
TUGRED = flat('tug_red', '#7a3b2a', 0.6); BLACK = flat('hull_black', '#1e1c1a', 0.6); STONE = flat('stone_trim', '#b3a68c', 0.8)
def brick(hexc): return node_mat('brick_' + hexc, lambda nt: courses(nt, srgb(hexc), tuple(c * 0.85 for c in srgb(hexc)), srgb('#b8ae98'), 0.24, 0.08, 0.012, bump=0.4))
def color_mat(hexc): return flat('c_' + hexc.lstrip('#'), hexc)

def classify(m):
    """The game's material for a box -> a Blender material."""
    if isinstance(m, list): key = m[0]
    elif isinstance(m, dict): return color_mat(m.get('color', '#888888'))
    else: key = m
    k = str(key).lower()
    if 'fence' in k: return FENCE
    if 'seawall' in k or 'granite' in k: return GRANITE
    if 'gate_fort' in k: return STUDDED
    if 'barge_deck' in k or 'desk' in k or 'crate' in k: return PLANK
    if 'trunk' in k: return node_mat('trunk', lambda nt: courses(nt, srgb('#6a4426'), srgb('#5a3820'), srgb('#2a1a10'), 0.9, 0.18, 0.02))
    if 'drum_clerestory' in k: return GLASS_LIT
    if k.startswith('#'):
        h = k.lstrip('#'); h = ''.join(c * 2 for c in h) if len(h) == 3 else h
        r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
        lum = 0.3 * r + 0.59 * g + 0.11 * b
        if max(r, g, b) - min(r, g, b) < 14 and lum < 70: return IRON                      # near-black greys: cast iron
        if r > g + 8 and lum < 90: return WOOD_D                                          # dark browns: timber
        return color_mat(k)
    return color_mat('#888888')

# ------------------------------------------------------------------ geometry
class Part:
    def __init__(self, group): self.bm = bmesh.new(); self.mats = []; self.group = group
    def mi(self, m):
        if m not in self.mats: self.mats.append(m)
        return self.mats.index(m)
    def tag(self, verts, m):
        i = self.mi(m)
        for f in {f for v in verts for f in v.link_faces}: f.material_index = i
    def box(self, c, size, m, rz=0.0, rx=0.0):
        """Box centred at Blender-space c, size (x, y, z) in Blender axes, turned rz about Z."""
        vs = bmesh.ops.create_cube(self.bm, size=1.0)['verts']
        bmesh.ops.scale(self.bm, vec=size, verts=vs)
        if rx: bmesh.ops.rotate(self.bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rx, 3, 'X'), verts=vs)
        if rz: bmesh.ops.rotate(self.bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rz, 3, 'Z'), verts=vs)
        bmesh.ops.translate(self.bm, vec=c, verts=vs); self.tag(vs, m)
    def cyl(self, c, r0, r1, h, m, seg=12, rx=0.0, rz=0.0):
        vs = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r0, radius2=r1, depth=h)['verts']
        if rx: bmesh.ops.rotate(self.bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rx, 3, 'X'), verts=vs)
        if rz: bmesh.ops.rotate(self.bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rz, 3, 'Z'), verts=vs)
        bmesh.ops.translate(self.bm, vec=c, verts=vs); self.tag(vs, m)
    def ico(self, c, r, m, sz=1.0, sub=1):
        vs = bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=r)['verts']
        bmesh.ops.scale(self.bm, vec=(1, 1, sz), verts=vs); bmesh.ops.translate(self.bm, vec=c, verts=vs); self.tag(vs, m)
    def poly(self, pts, m):
        """A flat polygon from Blender-space points (gable ends)."""
        vs = [self.bm.verts.new(p) for p in pts]; f = self.bm.faces.new(vs); f.material_index = self.mi(m)
    def verts_world(self, verts_t, m, faces):
        vs = [self.bm.verts.new(v) for v in verts_t]
        for fc in faces:
            try: f = self.bm.faces.new([vs[i] for i in fc]); f.material_index = self.mi(m)
            except ValueError: pass

GROUPS = {}
def part(group):
    p = Part(group); GROUPS.setdefault(group, []).append(p); return p

def local(cx, cz, ry):
    """Game-local frame (x along, y up, z back) turned ry about the vertical, at game (cx, cz) -> Blender point maker."""
    c, s = math.cos(ry), math.sin(ry)
    def to(lx, ly, lz):
        gx = cx + lx * c + lz * s; gz = cz - lx * s + lz * c       # three.js rotation.y
        return G(gx, ly, gz)
    return to

# ---- pieces --------------------------------------------------------
def b_box(rec):
    p = part('boxes')
    for bx in rec.get('boxes') or []:
        e = bx['m']; M = Matrix(((e[0], e[4], e[8], e[12]), (e[1], e[5], e[9], e[13]), (e[2], e[6], e[10], e[14]), (0, 0, 0, 1)))
        w, h, d = bx['p']['width'], bx['p']['height'], bx['p']['depth']
        corners = [M @ Vector((sx * w / 2, sy * h / 2, sz * d / 2)) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
        vs = [G(v.x, v.y, v.z) for v in corners]
        faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
        p.verts_world(vs, classify(rec['args'][6]), faces)

def b_shed(rec):
    a = rec['args']; x0, x1, z0, z1, h = a[0:5]; o = a[5] if len(a) > 5 and isinstance(a[5], dict) else {}
    rise, opened = o.get('rise', 1.6), o.get('open', False)
    wall = CLAP(o['wall'][1]['color']) if isinstance(o.get('wall'), list) and isinstance(o['wall'][1], dict) and 'color' in o['wall'][1] else CLAP('#d2cab4')
    p = part('sheds'); along_x = (x1 - x0) >= (z1 - z0)
    L, W = (x1 - x0, z1 - z0) if along_x else (z1 - z0, x1 - x0)
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2; ry = 0.0 if along_x else math.pi / 2
    to = local(cx, cz, ry); t = 0.16
    if not opened:
        for sz in (-1, 1): p.box(to(0, h / 2, sz * (W / 2 - t / 2)), (L, t, h), wall, rz=ry)                               # long walls
        for sx in (-1, 1):
            p.box(to(sx * (L / 2 - t / 2), h / 2, 0), (t, W, h), wall, rz=ry)                                              # end walls
            p.poly([to(sx * L / 2, h, -W / 2), to(sx * L / 2, h, W / 2), to(sx * L / 2, h + rise, 0)], wall)              # gable
        for sx in (-1, 1):
            for sz in (-1, 1): p.box(to(sx * (L / 2 - 0.05), h / 2, sz * (W / 2 - 0.05)), (0.18, 0.18, h + 0.05), TRIM, rz=ry)   # corner boards
        n = max(1, int(L // 4.2))
        for i in range(n):                                                                                                  # windows down both long sides
            lx = -L / 2 + (i + 0.5) * L / n
            for sz in (-1, 1):
                if sz == 1 and i == n // 2: p.box(to(lx, 1.1, W / 2 + 0.02), (1.3, 0.08, 2.2), WOOD_D, rz=ry); continue   # door on the near side
                p.box(to(lx, h * 0.55, sz * (W / 2 + 0.03)), (1.0, 0.06, 1.2), GLASS, rz=ry); p.box(to(lx, h * 0.55, sz * (W / 2 + 0.04)), (1.15, 0.03, 0.08), TRIM, rz=ry)
                p.box(to(lx, h * 0.55 - 0.66, sz * (W / 2 + 0.06)), (1.2, 0.08, 0.08), TRIM, rz=ry)
    else:
        for i in range(int(L // 4) + 1):
            lx = -L / 2 + i * L / max(1, int(L // 4))
            for sz in (-1, 1): p.box(to(lx, h / 2, sz * (W / 2 - 0.1)), (0.25, 0.25, h), WOOD_D, rz=ry)
    # roof: two sloping planes with overhang and a ridge board
    ov, slope = 0.45, math.atan2(rise, W / 2); half = math.hypot(W / 2 + ov, rise + ov * math.tan(slope))
    for sz in (-1, 1):
        cl = to(0, h + rise / 2 - 0.03, sz * W / 4)
        p.box(cl, (L + 2 * ov, half, 0.1), SHINGLE, rz=ry, rx=0) if False else None
        vs = []
        for (lx, lz, ly) in ((-L / 2 - ov, sz * (W / 2 + ov), h - ov * math.tan(slope)), (L / 2 + ov, sz * (W / 2 + ov), h - ov * math.tan(slope)), (L / 2 + ov, 0, h + rise), (-L / 2 - ov, 0, h + rise)):
            vs.append(to(lx, ly, lz))
        top = [v + Vector((0, 0, 0.1)) for v in vs]
        p.verts_world(vs + top, SHINGLE, [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)])
    p.box(to(0, h + rise + 0.08, 0), (L + 2 * ov, 0.22, 0.16), WOOD_D, rz=ry)

def b_building(rec):
    a = rec['args']; x0, x1, z0, z1, h = a[0:5]; fronts = a[5] if len(a) > 5 and isinstance(a[5], dict) else {}
    spec = None
    for k in ('s', 'n', 'e', 'w'):
        if isinstance(fronts.get(k), list) and isinstance(fronts[k][1], dict) and fronts[k][1].get('color'): spec = fronts[k][1]; break
    spec = spec or {'color': '#8e3b2e', 'floors': 5}
    p = part('buildings'); mat = brick(spec['color'])
    cx, cz, w, d = (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0
    p.box(G(cx, h / 2, cz), (w, d, h), mat)
    p.box(G(cx, h - 0.4, cz), (w + 0.5, d + 0.5, 0.8), STONE)                                                            # cornice
    floors = spec.get('floors', 5); store = h * spec.get('storeFrac', 0.18)
    for k, side in (('s', 1), ('n', -1)):
        if k not in fronts: continue
        fz = (z1 if side > 0 else z0) + side * 0.03
        p.box(G(cx, store / 2, fz), (w - 0.6, 0.06, store - 0.4), GLASS)                                                   # shop windows
        p.box(G(cx, store, fz), (w, 0.2, 0.35), STONE)                                                                     # shop cornice
        bays = max(2, round(w / 2.6)); fh = (h - store - 1.0) / floors
        for f in range(floors):
            y = store + 0.6 + (f + 0.5) * fh
            for b in range(bays):
                x = x0 + (b + 0.5) * w / bays
                lit = rnd.random() < 0.15
                p.box(G(x, y, fz), (0.95, 0.12, fh * 0.6), GLASS_LIT if lit else GLASS)
                p.box(G(x, y + fh * 0.33, fz + side * 0.04), (1.15, 0.12, 0.14), STONE); p.box(G(x, y - fh * 0.32, fz + side * 0.05), (1.1, 0.16, 0.08), STONE)

def b_tree(rec):
    a = rec['args']; x, z = a[0], a[1]; s = a[2] if len(a) > 2 and isinstance(a[2], (int, float)) else 1
    p = part('trees'); th = 3.2 * s
    p.cyl(G(x, th / 2, z), 0.22 * s, 0.14 * s, th, WOOD_D, seg=8)
    leaf = [flat('leaf_a', '#b06a22', 0.9), flat('leaf_b', '#c8902a', 0.9), flat('leaf_c', '#8a7a2a', 0.9), flat('leaf_d', '#9a4a1e', 0.9)]
    m = leaf[int(abs(x * 7 + z * 3)) % 4]
    for k in range(6):
        ang = k * 1.1 + x; rr = (0.9 + rnd.random() * 0.6) * s
        p.ico(G(x + math.cos(ang) * 0.9 * s, th + 0.6 * s + rnd.random() * 1.4 * s, z + math.sin(ang) * 0.9 * s), rr * 1.3, m, sz=0.85)

def b_bench(rec):
    a = rec['args']; x, z = a[0], a[1]; ry = a[2] if len(a) > 2 else 0
    p = part('small'); to = local(x, z, ry); w = 1.8
    for zz in (-0.17, -0.04, 0.09): p.box(to(0, 0.45, zz), (w, 0.11, 0.035), PLANK, rz=ry)
    for yy in (0.62, 0.78): p.box(to(0, yy, 0.2), (w, 0.03, 0.09), PLANK, rz=ry)
    for sx in (-w / 2 + 0.12, w / 2 - 0.12): p.box(to(sx, 0.4, 0.0), (0.05, 0.42, 0.8), IRON, rz=ry)

def b_pavilion(rec):
    a = rec['args']; x, z = a[0], a[1]; r = a[2] if len(a) > 2 else 3.2; h = a[3] if len(a) > 3 else 2.8
    p = part('small')
    for k in range(8):
        ang = k * math.pi / 4; px, pz = x + math.sin(ang) * r, z + math.cos(ang) * r
        p.cyl(G(px, h / 2, pz), 0.1, 0.09, h, IRON, seg=8)
        a2 = ang + math.pi / 4; p.box(G((px + x + math.sin(a2) * r) / 2, 0.9, (pz + z + math.cos(a2) * r) / 2), (2 * r * math.sin(math.pi / 8), 0.05, 0.05), IRON, rz=-(ang + math.pi / 8) + math.pi / 2)
    p.cyl(G(x, h + 0.8, z), r + 0.6, 0.15, 1.6, SHINGLE, seg=8); p.ico(G(x, h + 1.75, z), 0.2, BRASS)
    p.cyl(G(x, 0.08, z), r + 0.3, r + 0.3, 0.16, STONE, seg=8)

def b_hamper(rec):
    x, z = rec['args'][0], rec['args'][1]; p = part('small')
    wick = node_mat('wicker', lambda nt: courses(nt, srgb('#a88a52'), srgb('#8e7240'), srgb('#5a4424'), 0.08, 0.05, 0.03, bump=0.8))
    p.box(G(x, 0.3, z), (0.9, 0.55, 0.6), wick); p.box(G(x, 0.62, z), (0.94, 0.59, 0.06), wick)
    for dx in (-0.25, 0.25): p.box(G(x + dx, 0.33, z), (0.05, 0.57, 0.64), flat('strap', '#4a3020'))

def b_bundle(rec):
    a = rec['args']; x, z = a[0], a[1]; c = a[2] if len(a) > 2 and isinstance(a[2], str) else '#7a5a6a'
    p = part('small'); p.ico(G(x, 0.3, z), 0.42, flat('cloth_' + c.lstrip('#'), c, 0.95), sz=0.7, sub=2)
    p.cyl(G(x, 0.55, z), 0.08, 0.02, 0.22, flat('cloth_' + c.lstrip('#'), c, 0.95), seg=6)

def b_barrel(rec):
    x, z = rec['args'][0], rec['args'][1]; p = part('small')
    p.cyl(G(x, 0.45, z), 0.3, 0.3, 0.9, WOOD_D, seg=14); p.cyl(G(x, 0.45, z), 0.34, 0.34, 0.5, WOOD_D, seg=14)
    for y in (0.12, 0.78): p.cyl(G(x, y, z), 0.32, 0.32, 0.05, IRON, seg=14)

def b_crate(rec):
    a = rec['args']; x, z = a[0], a[1]; s = a[2] if len(a) > 2 else 0.6
    p = part('small'); p.box(G(x, s * 0.4, z), (s, s, s * 0.8), PLANK)
    for dz in (-1, 1): p.box(G(x, s * 0.4, z + dz * s / 2), (s + 0.02, 0.03, 0.08), WOOD_D)

def b_ringwall(rec):
    a = rec['args']; cx, cz, r, h = a[0], a[1], a[2], a[3]; gaps = a[5] if len(a) > 5 else []
    p = part('fort'); seg = 160; rin = r - 1.0
    def ingap(t): return any(g0 <= t <= g1 or g0 <= t - 2 * math.pi <= g1 for g0, g1 in gaps)
    ports = [0.25 + i * 0.28 for i in range(23)]
    for i in range(seg):
        t0, t1 = i * 2 * math.pi / seg, (i + 1) * 2 * math.pi / seg; tm = (t0 + t1) / 2
        if ingap(tm): continue
        port = any(abs(tm - pa) < 0.016 for pa in ports)
        def pt3(t, rr, y): return G(cx + math.sin(t) * rr, y, cz + math.cos(t) * rr)
        spans = [(0, h)] if not port else [(0, 2.25), (3.75, h)]
        for (y0, y1) in spans:
            vs = [pt3(t0, r, y0), pt3(t1, r, y0), pt3(t1, r, y1), pt3(t0, r, y1), pt3(t0, rin, y0), pt3(t1, rin, y0), pt3(t1, rin, y1), pt3(t0, rin, y1)]
            p.verts_world(vs, SAND, [(0, 1, 2, 3), (5, 4, 7, 6), (3, 2, 6, 7), (4, 5, 1, 0)])
        if port:   # recess: dark glass set back in the old gun port
            p.verts_world([pt3(t0, rin + 0.2, 2.25), pt3(t1, rin + 0.2, 2.25), pt3(t1, rin + 0.2, 3.75), pt3(t0, rin + 0.2, 3.75)], GLASS, [(0, 1, 2, 3)])
            p.verts_world([pt3(t0, r, 2.25), pt3(t1, r, 2.25), pt3(t1, rin + 0.2, 2.25), pt3(t0, rin + 0.2, 2.25)], STONE, [(0, 1, 2, 3)])
    # coping and a string course
    for (y, dy, ro) in ((h, 0.35, 0.25), (6.2, 0.25, 0.12)):
        for i in range(seg):
            t0, t1 = i * 2 * math.pi / seg, (i + 1) * 2 * math.pi / seg
            if ingap((t0 + t1) / 2): continue
            def q(t, rr, yy): return G(cx + math.sin(t) * rr, yy, cz + math.cos(t) * rr)
            vs = [q(t0, r + ro, y), q(t1, r + ro, y), q(t1, r + ro, y + dy), q(t0, r + ro, y + dy), q(t0, r - 0.1, y), q(t1, r - 0.1, y), q(t1, r - 0.1, y + dy), q(t0, r - 0.1, y + dy)]
            p.verts_world(vs, STONE, [(0, 1, 2, 3), (3, 2, 6, 7), (4, 5, 1, 0)])

def b_wallline(rec):
    a = rec['args']; x1, z1, x2, z2, h = a[0:5]; t = a[6] if len(a) > 6 else 0.4; y = a[7] if len(a) > 7 else 0
    p = part('fort'); L = math.hypot(x2 - x1, z2 - z1); ry = -math.atan2(z2 - z1, x2 - x1)
    to = local((x1 + x2) / 2, (z1 + z2) / 2, ry)
    p.box(to(0, y + h / 2, 0), (L, t, h), SAND, rz=ry)
    if y > 0: p.box(to(0, y - 0.15, 0), (L + 0.3, t + 0.3, 0.3), STONE, rz=ry)                                            # lintel over the door
    else: p.box(to(0, y + h - 0.2, 0), (L, t + 0.5, 0.4), STONE, rz=ry)

def b_wallcap(rec): pass   # the coping is part of the ring wall

def b_office(rec):
    s = rec['args'][0]; p = part('office'); to = local(s['x'], s['z'], s['ry']); w, h, d = s['w'], s['h'], s['d']
    stucco = node_mat('stucco', lambda nt: courses(nt, srgb('#d6cdb6'), srgb('#cfc5ac'), srgb('#b8ae98'), 1.6, 0.6, 0.01, bump=0.2))
    p.box(to(0, h / 2, 0), (w, d, h), stucco, rz=s['ry'])
    p.box(to(0, h - 0.25, d / 2), (w + 0.6, 0.7, 0.5), STONE, rz=s['ry']); p.box(to(0, 0.4, d / 2), (w + 0.2, 0.3, 0.8), STONE, rz=s['ry'])
    for f in range(3):
        y = 1.6 + f * 2.7
        p.box(to(0, y + 1.0, d / 2 + 0.05), (w, 0.12, 0.15), STONE, rz=s['ry'])                                            # floor bands
        for b in range(7):
            x = -w / 2 + (b + 0.5) * w / 7
            if f == 0 and b == 3:      # arched front door
                p.box(to(x, 1.25, d / 2 + 0.04), (1.3, 0.08, 2.5), WOOD_D, rz=s['ry']); p.cyl(to(x, 2.5, d / 2 + 0.04), 0.65, 0.65, 0.1, WOOD_D, seg=12, rx=math.pi / 2, rz=s['ry']); continue
            p.box(to(x, y, d / 2 + 0.04), (0.95, 0.1, 1.5), GLASS_LIT if (f + b) % 4 == 0 else GLASS, rz=s['ry'])
            p.box(to(x, y + 0.85, d / 2 + 0.08), (1.2, 0.14, 0.14), STONE, rz=s['ry']); p.box(to(x, y - 0.82, d / 2 + 0.08), (1.1, 0.16, 0.08), STONE, rz=s['ry'])

def b_bargehood(rec):
    s = rec['args'][0]; p = part('small'); seg = 12
    boards = node_mat('hood', lambda nt: courses(nt, srgb('#c8c0aa'), srgb('#b8b09a'), srgb('#6a6458'), 0.5, 0.25, 0.02, axis='XY', bump=0.4))
    for i in range(seg):
        a0, a1 = -math.pi / 2 + i * math.pi / seg, -math.pi / 2 + (i + 1) * math.pi / seg
        def q(a, zz): return G(s['x'] + math.sin(a) * s['r'], s['y'] + math.cos(a) * s['r'] * s['sy'], zz)
        z0, z1 = s['z'] - s['len'] / 2, s['z'] + s['len'] / 2
        p.verts_world([q(a0, z0), q(a1, z0), q(a1, z1), q(a0, z1)], boards, [(0, 1, 2, 3)]); p.verts_world([q(a0, z0), q(a1, z0), q(a1, z1), q(a0, z1)], boards, [(3, 2, 1, 0)])   # both sides
    for zz in (s['z'] - s['len'] / 2, s['z'] + s['len'] / 2):
        pts = [G(s['x'] + math.sin(-math.pi / 2 + k * math.pi / seg) * s['r'], s['y'] + math.cos(-math.pi / 2 + k * math.pi / seg) * s['r'] * s['sy'], zz) for k in range(seg + 1)]
        p.verts_world(pts, boards, [tuple(range(seg + 1))])

def b_funnel(rec):
    s = rec['args'][0]; p = part('small')
    p.cyl(G(s['x'], s['y'], s['z']), 0.6, 0.55, s['h'], BLACK, seg=14); p.cyl(G(s['x'], s['y'] + s['h'] / 2 - 0.5, s['z']), 0.62, 0.62, 0.5, TUGRED, seg=14)

BUILD = {'box': b_box, 'shed': b_shed, 'building': b_building, 'tree': b_tree, 'bench': b_bench, 'pavilion': b_pavilion, 'hamper': b_hamper,
         'bundle': b_bundle, 'barrel': b_barrel, 'crate': b_crate, 'ringWall': b_ringwall, 'wallLine': b_wallline, 'wallCap': b_wallcap,
         'office': b_office, 'bargeHood': b_bargehood, 'funnel': b_funnel}
skipped = {}
for rec in SCENE:
    f = BUILD.get(rec['kind'])
    if f: f(rec)
    else: skipped[rec['kind']] = skipped.get(rec['kind'], 0) + 1
print('skipped kinds:', skipped)

objs = []
for g, parts in GROUPS.items():
    bm = bmesh.new(); mats = []
    me = bpy.data.meshes.new(g)
    allbm = bmesh.new()
    for p in parts:
        tmp = bpy.data.meshes.new('tmp'); p.bm.to_mesh(tmp)
        remap = [mats.index(m) if m in mats else (mats.append(m) or len(mats) - 1) for m in p.mats]
        for poly in tmp.polygons: poly.material_index = remap[poly.material_index] if poly.material_index < len(remap) else 0
        allbm.from_mesh(tmp); bpy.data.meshes.remove(tmp); p.bm.free()
    allbm.normal_update(); allbm.to_mesh(me); allbm.free()
    for m in mats: me.materials.append(m)
    ob = bpy.data.objects.new(g, me); col.objects.link(ob); objs.append(ob)
print('groups', {o.name: len(o.data.polygons) for o in objs})

# ------------------------------------------------------------------ light, the baked hall for shadows, ground
for f in ('castle_interior.glb', 'castle_props.glb'):
    path = os.path.join(ROOT, 'assets', 'models', f)
    if os.path.exists(path): bpy.ops.import_scene.gltf(filepath=path)
sun_dir = (G(0, 0, 0) - G(-30, 50, 40)).normalized()
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 4.5; sun.angle = math.radians(1.5); sun.color = (1.0, 0.94, 0.84)
so = bpy.data.objects.new('sun', sun); col.objects.link(so); so.rotation_euler = sun_dir.to_track_quat('-Z', 'Y').to_euler()
world = bpy.data.worlds.new('sky'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*srgb('#c4c8cc'), 1); bg.inputs['Strength'].default_value = 1.1
gb = bmesh.new(); bmesh.ops.create_grid(gb, x_segments=1, y_segments=1, size=300); gme = bpy.data.meshes.new('ground'); gb.to_mesh(gme); gb.free()
gme.materials.append(flat('ground', '#8a847a', 0.9)); gob = bpy.data.objects.new('ground', gme); col.objects.link(gob); gob.location = (0, 0, -0.01)
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.use_denoising = True; scene.view_settings.view_transform = 'Standard'

if MODE == 'preview':
    cam = bpy.data.cameras.new('cam'); cam.lens = 18; co = bpy.data.objects.new('cam', cam); col.objects.link(co); scene.camera = co
    eye = G(*map(float, os.environ.get('EYE', '-6,7,82').split(','))); look = G(*map(float, os.environ.get('LOOK', '6,5,0').split(',')))
    co.location = eye; co.rotation_euler = (look - eye).to_track_quat('-Z', 'Y').to_euler()
    scene.cycles.samples = 24; scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.render.filepath = os.path.join(OUT, 'exterior_preview.png'); bpy.ops.render.render(write_still=True); print('wrote', scene.render.filepath); sys.exit(0)

scene.cycles.samples = 16; scene.render.bake.margin = 3
SIZES = {'boxes': 1024, 'buildings': 1024, 'fort': 1024, 'sheds': 1024, 'office': 1024, 'trees': 512, 'small': 512}
for ob in objs:
    uv = ob.data.uv_layers.new(name='bake'); ob.data.uv_layers.active = uv
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.002); bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new(ob.name + '_baked', SIZES.get(ob.name, 512), SIZES.get(ob.name, 512))
    for m in ob.data.materials:
        nd = m.node_tree.nodes.new('ShaderNodeTexImage'); nd.image = img; m.node_tree.nodes.active = nd
    print('baking', ob.name, flush=True); bpy.ops.object.bake(type='COMBINED')
    m = bpy.data.materials.new(ob.name + '_mat'); m.use_nodes = True; t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = img
    m.node_tree.links.new(t.outputs['Color'], m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    ob.data.materials.clear(); ob.data.materials.append(m)
    for l in list(ob.data.uv_layers):
        if l.name != 'bake': ob.data.uv_layers.remove(l)
bpy.ops.object.select_all(action='DESELECT')
for ob in objs: ob.select_set(True)
path = os.path.join(OUT, 'castle_exterior.glb')
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_image_format='WEBP', export_image_quality=82, export_lights=False, export_cameras=False)
print('wrote', path, os.path.getsize(path) // 1024, 'KB')
