import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function hailOfThornsEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  const itemMacroText = await DDBMacros.loadMacroFile("spell", "hailOfThorns.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "spell", macroName: "hailOfThorns.js", document }),
  );
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = null;
  document.system.save.ability = "";
  document.system.target.type = "self";

  return document;
}
