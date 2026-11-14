#!/usr/bin/env python3
"""
Character art: name, key and shrink images straight from Google Flow.

  python3 tools/prep-art.py            process everything in art-source/characters/
  python3 tools/prep-art.py --sort     first, rename the uploads in the repo root using MAP below

Originals live in art-source/characters/<file id>.jpg (kept, not loaded by the game).
The game loads assets/art/<file id>.webp: green background removed, cropped to the
figure, at most 900 px tall (720 for close-ups). Needs Pillow and numpy.
"""
import sys, os, glob, shutil
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, 'art-source', 'characters'), os.path.join(ROOT, 'assets', 'art')

# Flow's file names (the part before the random code) -> game file id
MAP = {
  'Apprentice_holding_loaf_of_bread_80d0df04': 'portrait_boarder',
  'Bearded_man_standing_in_coat_171f1d31': 'portrait_crowd7',
  'Boy_coughing_with_frightened_exp…_a45c39a3': 'portrait_shmuel_down',
  'Boy_holding_wooden_spinning_top_4786699d': 'portrait_child0',
  'Boy_holding_wooden_toy_horse_30d0ecea': 'portrait_shmuel',
  'Boy_smiling_and_asking_question_763939ee': 'portrait_shmuel_up',
  "Bricklayer_holding_mason's_trowel_1ee7e39d": 'portrait_worker0',
  'Character_illustration_of_Jack_D…_0fa0e2ec': 'portrait_runner',
  'Character_illustration_of_labore…_f7f9e359': 'portrait_giuseppe',
  'Character_illustration_of_ship_s…_3266509f': 'portrait_steward',
  'Character_portrait_for_history_game_8a630e53': 'portrait_rivka_down',
  'Character_portrait_for_history_game_c36a96d5': 'portrait_novak_down',
  'Character_portrait_for_history_game_d68d0c48': 'portrait_esther_down',
  'Character_portrait_illustration_…_3712bea7': 'portrait_girl_down',
  'Character_portrait_of_garment_co…_205f6a65': 'portrait_kessler_down',
  'Character_portrait_of_garment_co…_cc2e3aff': 'portrait_kessler_up',
  'Character_portrait_of_weaver_Ant…_83d36e14': 'portrait_novak_up',
  'Character_portrait_of_young_girl_74f06fb2': 'portrait_girl_up',
  'Clerk_holding_open_ledger_b601d44a': 'portrait_clerk',
  'Construction_foreman_holding_bui…_3a1c3763': 'portrait_foreman',
  'Elderly_weaver_holding_wooden_horse_9babc6f9': 'portrait_novak',
  'Elderly_woman_standing_in_dress_44ebf511': 'portrait_crowd3',
  'Elevator_operator_standing_at_at…_aef0828d': 'portrait_elevator',
  'Farmer_holding_wheat_illustration_7a232ddd': 'portrait_weber',
  'Frau_Weber_holding_rye_bread_b4502016': 'portrait_fraweber',
  'Garment_contractor_holding_wool_…_0e705e3d': 'portrait_kessler',
  'Girl_holding_letter_portrait_326c404b': 'portrait_rivka',
  'Girl_smiling_with_happy_tears_454f7ed4': 'portrait_rivka_up',
  'Ironworker_holding_hammer_illust…_8fbc8934': 'portrait_worker1',
  'Italian_laborer_character_illust…_8aa47cf3': 'portrait_crowd2',
  'Keeper_holding_whistle_in_park_cb4677ca': 'portrait_keeper',
  'Laborer_portrait_in_pain_a59e3aab': 'portrait_giuseppe_down',
  'Lamplighter_standing_with_lighti…_010e78b5': 'portrait_lamplighter',
  'Man_carrying_bricks_2720767a': 'portrait_hodcarrier',
  'Man_holding_books_standing_ce817fd9': 'portrait_guild',
  'Man_holding_camera_illustration_e7d05908': 'portrait_riis',
  'Man_holding_cigar_standing_260413bd': 'portrait_plunkitt',
  'Man_holding_telegram_form_standing_796b1e0b': 'portrait_tomas',
  'Man_holding_whip_standing_ab42685d': 'portrait_driver',
  'Man_offering_sack_of_coal_96db54a8': 'portrait_boss',
  'Man_posing_for_portrait_26905452': 'portrait_boss_down',
  'Man_shouting_with_joy_portrait_4b8d4e6e': 'portrait_giuseppe_up',
  'Man_shouting_with_megaphone_illu…_6de86ea9': 'portrait_bulletin',
  'Man_smiling_portrait_illustration_edc49492': 'portrait_boss_up',
  'Merchant_expressing_quiet_grief_59cb475c': 'portrait_lee_down',
  'Merchant_holding_tea_canister_73773ab5': 'portrait_lee',
  'Merchant_welcoming_customer_port…_2295fa53': 'portrait_lee_up',
  'Money_changer_holding_foreign_coins_e06fc2a3': 'portrait_changer',
  'Newsboy_holding_newspapers_8e5faf06': 'portrait_newsboy',
  'Newspaper_editor_holding_proof_s…_0f5dee7d': 'portrait_editor',
  'Newspaper_reporter_holding_folde…_039b6aca': 'portrait_oldrep',
  'Office_clerk_character_illustration_7b2135d6': 'portrait_crowd4',
  'Peddler_holding_tin_pots_9c97866e': 'portrait_peddler2',
  'Physician_inspecting_immigrants_…_f0ac9218': 'portrait_doctor',
  'Priest_standing_against_green_sc…_5683582c': 'portrait_priest',
  'Railway_guard_calling_out_stop_899d1d52': 'portrait_elguard',
  'Secretary_holding_dues_book_illu…_bc9376c0': 'portrait_rabbi',
  'Signor_Bellini_holding_coin_purse_7a10b24c': 'portrait_societa',
  'Street_child_character_illustration_abf5b7d3': 'portrait_crowd5',
  'Tailor_begging_photographer_94893ab4': 'portrait_moishe_down',
  'Tailor_holding_shears_illustration_2f53de2f': 'portrait_moishe',
  'Tailor_smiling_after_voting_825a0ea7': 'portrait_moishe_up',
  'Woman_holding_Sabbath_candlestick_b824bd07': 'portrait_mama',
  'Woman_holding_map_portrait_6917d4e0': 'portrait_agent',
  'Woman_holding_onions_c45292bd': 'portrait_peddler',
  'Woman_holding_union_card_speaking_dd2cde4e': 'portrait_esther',
  'Woman_pleading_on_ship_e163f45c': 'portrait_mama_down',
  'Woman_portrait_for_history_game_31e2e005': 'portrait_brennan_down',
  'Woman_portrait_for_history_game_86ffe957': 'portrait_chana_down',
  'Woman_sewing_dark_wool_coat_77cf957b': 'portrait_chana',
  'Woman_shopping_with_wicker_basket_4b856196': 'portrait_crowd1',
  'Woman_smiling_in_green_background_245d7e08': 'portrait_chana_up',
  'Woman_smiling_on_election_night_a9dee836': 'portrait_brennan_up',
  'Woman_speaking_on_soapbox_2d3bda55': 'portrait_esther_up',
  'Woman_standing_with_folded_arms_ac6de2cf': 'portrait_brennan',
  'Woman_weeping_with_relief_portrait_93a61a40': 'portrait_mama_up',
  'Working_man_walking_street_38447485': 'portrait_crowd0',
  'Young_woman_standing_illustration_9dedc840': 'portrait_crowd6',
}

def sort_uploads():
    os.makedirs(SRC, exist_ok=True)
    moved = 0
    for f in glob.glob(os.path.join(ROOT, '*.jp*g')) + glob.glob(os.path.join(ROOT, '*.png')):
        stem = os.path.splitext(os.path.basename(f))[0]
        if stem in MAP:
            dst = os.path.join(SRC, MAP[stem] + os.path.splitext(f)[1].lower().replace('jpeg', 'jpg'))
            os.system(f'git -C "{ROOT}" mv -f "{f}" "{dst}" 2>/dev/null') or None
            if os.path.exists(f): shutil.move(f, dst)
            moved += 1
        else:
            print('  not recognised, left in place:', os.path.basename(f))
    print(f'sorted {moved} uploads into art-source/characters/')

def connected_to_border(cand):
    """Pixels of `cand` reachable from the image border through `cand` (4-neighbour flood fill in numpy)."""
    reach = np.zeros_like(cand)
    reach[0], reach[-1], reach[:, 0], reach[:, -1] = cand[0], cand[-1], cand[:, 0], cand[:, -1]
    while True:
        grow = reach.copy()
        grow[1:] |= reach[:-1]; grow[:-1] |= reach[1:]; grow[:, 1:] |= reach[:, :-1]; grow[:, :-1] |= reach[:, 1:]
        grow &= cand
        if (grow == reach).all(): return reach
        reach = grow

def key(path, max_h):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    # background colour from the four corners
    # (only border pixels that are clearly green count: close-ups often fill the bottom corners)
    border = np.concatenate([a[:4].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3), a[-4:].reshape(-1, 3)])
    gb = border[(border[:, 1] - np.maximum(border[:, 0], border[:, 2])) > 40]
    bg = np.median(gb if len(gb) > 50 else border, axis=0)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    dist = np.abs(a - bg).sum(axis=2)
    greenness = g - np.maximum(r, b)                       # how much greener than anything else
    bg_green = max(1, bg[1] - max(bg[0], bg[2]))
    # 1) background candidates: close to the screen colour AND strongly green (teal cloth is not)
    cand = (dist < 120) & (greenness > bg_green * 0.55)
    # 2) keep only candidates connected to the image border, plus enclosed pockets that match exactly
    bgmask = connected_to_border(cand) | (cand & (dist < 45))
    # 3) soft outline: alpha ramps over two pixels at the boundary
    solid = (~bgmask).astype(np.float32)
    A = Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    # 4) despill only along the outline, where the green screen bleeds into the ink
    near = np.asarray(Image.fromarray(bgmask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7))) > 0
    out = a.copy()
    fix = near & (greenness > 0)
    out[..., 1] = np.where(fix, np.maximum(r, b), g)
    rgba = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).convert('RGBA'); rgba.putalpha(A)
    bbox = A.point(lambda v: 255 if v > 40 else 0).getbbox() or (0, 0, w, h)
    pad = int(h * 0.01)
    bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + (pad if bbox[3] < h - 2 else 0)))
    rgba = rgba.crop(bbox)
    if rgba.height > max_h:
        rgba = rgba.resize((round(rgba.width * max_h / rgba.height), max_h), Image.LANCZOS)
    return rgba

def main():
    if '--sort' in sys.argv: sort_uploads()
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(os.path.join(SRC, 'portrait_*.*')))
    total = 0
    for f in files:
        fid = os.path.splitext(os.path.basename(f))[0]
        bust = fid.endswith('_up') or fid.endswith('_down')
        im = key(f, 720 if bust else 900)
        dst = os.path.join(OUT, fid + '.webp')
        im.save(dst, 'WEBP', quality=86, method=6)
        total += os.path.getsize(dst)
    print(f'{len(files)} images -> assets/art/*.webp, {total / 1e6:.1f} MB in all')

if __name__ == '__main__':
    main()
