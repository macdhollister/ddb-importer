export default class SystemHelpers {

  static effectModules() {
    if (CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules) {
      return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
    }
    const midiQolInstalled = game.modules.get("midi-qol")?.active ?? false;
    const timesUpInstalled = game.modules.get("times-up")?.active ?? false;
    const daeInstalled = game.modules.get("dae")?.active ?? false;

    const activeAurasInstalled = game.modules.get("ActiveAuras")?.active ?? false;
    const auraeffectsInstalled = game.modules.get("auraeffects")?.active ?? false;
    const atlInstalled = game.modules.get("ATL")?.active ?? false;
    const tokenMagicInstalled = game.modules.get("tokenmagic")?.active ?? false;
    const autoAnimationsInstalled = game.modules.get("autoanimations")?.active ?? false;
    const chrisInstalled = (game.modules.get("chris-premades")?.active
      && foundry.utils.isNewerVersion(game.modules.get("chris-premades").version, "1.1.10")
    ) ?? false;
    const vision5eInstalled = game.modules.get("vision-5e")?.active ?? false;

    CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules = {
      hasCore: midiQolInstalled && timesUpInstalled && daeInstalled,
      hasMonster: midiQolInstalled && timesUpInstalled && daeInstalled,
      midiQolInstalled,
      timesUpInstalled,
      daeInstalled,
      atlInstalled,
      tokenMagicInstalled,
      activeAurasInstalled,
      auraeffectsInstalled,
      autoAnimationsInstalled,
      chrisInstalled,
      vision5eInstalled,
    };
    return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
  }

  static parseBasicDamageFormula(data, formula, { stripMod = false } = {}) {
    const basicMatchRegex = /^\s*(\d+)d(\d+)(?:\s*([+|-])\s*(@?[\w\d.-]+))?\s*$/i;
    const damageMatch = `${formula}`.match(basicMatchRegex);

    if (damageMatch && CONFIG.DND5E.dieSteps.includes(Number(damageMatch[2]))) {
      data.number = Number(damageMatch[1]);
      data.denomination = Number(damageMatch[2]);
      if (damageMatch[4]) data.bonus = damageMatch[3] === "-" ? `-${damageMatch[4]}` : damageMatch[4];
      if (stripMod) data.bonus = data.bonus.replace(/@mod/, "").trim().replace(/^\+/, "").trim();
    } else if (Number.isInteger(Number.parseInt(formula))) {
      data.bonus = formula;
    } else {
      data.custom.enabled = true;
      data.custom.formula = formula;
    }
  }

  static buildDamagePart({ dice = null, damageString = "", type = null, types = null, stripMod = false } = {}) {
    const damage = {
      number: null,
      denomination: 0,
      bonus: "",
      types: types ?? (type ? [type.toLowerCase()] : []),
      custom: {
        enabled: false,
        formula: "",
      },
      scaling: {
        mode: "", // whole, half or ""
        number: null,
        formula: "",
      },
    };

    if (dice && !dice.multiplier) {
      damage.number = dice.diceCount;
      damage.denomination = dice.diceValue;
      if (dice.fixedValue) damage.bonus = dice.fixedValue;
      if (dice.value) damage.bonus = dice.value;
    } else {
      SystemHelpers.parseBasicDamageFormula(damage, damageString, { stripMod });
    }
    return damage;
  }

  // eslint-disable-next-line complexity
  static getTemplate(type) {
    const initFunction = foundry.utils.isNewerVersion(game.version, "13")
      ? "getInitialValue"
      : "initial";
    switch (type.toLowerCase()) {
      case "character":
        return game.dnd5e.dataModels.actor.CharacterData.schema[initFunction]();
      case "npc":
        return game.dnd5e.dataModels.actor.NPCData.schema[initFunction]();
      case "vehicle":
        return game.dnd5e.dataModels.actor.VehicleData.schema[initFunction]();
      case "class":
        return game.dnd5e.dataModels.item.ClassData.schema[initFunction]();
      case "background":
        return game.dnd5e.dataModels.item.BackgroundData.schema[initFunction]();
      case "consumable":
        return game.dnd5e.dataModels.item.ConsumableData.schema[initFunction]();
      case "backpack":
      case "container":
        return game.dnd5e.dataModels.item.ContainerData.schema[initFunction]();
      case "equipment":
      case "armor":
        return game.dnd5e.dataModels.item.EquipmentData.schema[initFunction]();
      case "feat":
        return game.dnd5e.dataModels.item.FeatData.schema[initFunction]();
      case "loot":
        return game.dnd5e.dataModels.item.LootData.schema[initFunction]();
      case "race":
        return game.dnd5e.dataModels.item.RaceData.schema[initFunction]();
      case "spell":
        return game.dnd5e.dataModels.item.SpellData.schema[initFunction]();
      case "subclass":
        return game.dnd5e.dataModels.item.SubclassData.schema[initFunction]();
      case "tool":
        return game.dnd5e.dataModels.item.ToolData.schema[initFunction]();
      case "weapon":
        return game.dnd5e.dataModels.item.WeaponData.schema[initFunction]();
      case "journalpage":
      case "classjournalpage":
        return game.dnd5e.dataModels.journal.ClassJournalPageData.schema[initFunction]();
      case "spelllistjournalpage":
        return game.dnd5e.dataModels.journal.SpellListJournalPageData.schema[initFunction]();
      case "maplocationjournalpage":
        return game.dnd5e.dataModels.journal.MapLocationJournalPageData.schema[initFunction]();
      case "subclassjournalpage":
        return game.dnd5e.dataModels.journal.SubClassJournalPageData.schema[initFunction]();
      case "rulejournalpage":
        return game.dnd5e.dataModels.journal.RuleJournalPageData.schema[initFunction]();
      case "dnd-tashas-cauldron.tattoo":
      case "tattoo":
        return CONFIG.Item.dataModels["dnd-tashas-cauldron.tattoo"].schema[initFunction]();
      default:
        return undefined;
    }
  }

}
