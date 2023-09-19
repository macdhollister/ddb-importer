/* eslint-disable no-await-in-loop */
import { forceItemEffect, generateStatusEffectChange } from "../effects.js";
import DDBMacros from "../macros.js";
import { baseMonsterFeatureEffect } from "../specialMonsters.js";


export async function venomTrollEffects(npc) {
  for (let item of npc.items) {
    if (item.name.startsWith("Venom Spray")) {
      let effect = baseMonsterFeatureEffect(item, item.name);
      effect.changes.push(
        {
          key: "flags.midi-qol.OverTime",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: "turn=end, saveAbility=con, saveDC=@abilities.str.dc, label=Poisoned by Venom Spray",
          priority: "20",
        },
        generateStatusEffectChange("Poisoned", 20, true)
      );

      setProperty(effect, "duration.seconds", 60);
      setProperty(effect, "duration.rounds", 10);
      setProperty(effect, "flags.dae.stackable", "noneName");

      const itemMacroText = await DDBMacros.loadMacroFile("monsterFeature", "venomSpray.js");
      item = DDBMacros.generateItemMacroFlag(item, itemMacroText);
      DDBMacros.setMidiOnUseMacroFlag(item, "monsterFeature", "venomSpray.js", ["postActiveEffects"]);

      item.effects.push(effect);
    } else if (item.name === "Poison Splash") {
      let effect = baseMonsterFeatureEffect(item, item.name);
      effect.changes.push(
        DDBMacros.generateOnUseMacroChange({ macroPass: "isDamaged", macroType: "monsterFeature", macroName: "venomSpray.js" }),
      );
      effect.transfer = true;
      setProperty(effect, "flags.dae.stackable", "noneName");

      const itemMacroText = await DDBMacros.loadMacroFile("monsterFeature", "poisonSplash.js");
      item = DDBMacros.generateItemMacroFlag(item, itemMacroText);

      item.effects.push(effect);

      item.system.target = {
        "value": 5,
        "width": null,
        "units": "ft",
        "type": "creature"
      };
      item.system.range.units = "spec";
      item.system.duration.units = "inst";

    } else if (item.name === "Regeneration") {
      let effect = baseMonsterFeatureEffect(item, item.name);
      effect.changes.push(
        {
          key: "flags.midi-qol.OverTime",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: `turn=start, damageRoll=${item.system.damage.parts[0][0]}, damageType=healing, condition=@attributes.hp.value > 0 && @attributes.hp.value < @attributes.hp.max, rollMode=gmroll, label=${item.name} (Fire or Acid prevents)`,
          priority: "20",
        },
      );
      setProperty(effect, "flags.dae.transfer", true);
      effect.transfer = true;
      item.system.damage.parts = [];
      item.effects.push(effect);
    }
    item = forceItemEffect(item);
  }

  return npc;
}

