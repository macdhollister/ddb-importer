/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DragonWings extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Use",
      noConsumeTargets: true,
      // default scrape picks up the 5 sorcery point recharge effect
      addItemConsume: true,
      targetType: "self",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Spend Sorcery Points to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "3",
                target: "Font of Magic: Sorcery Points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Dragon Wings",
      max: "1",
      period: "lr",
    });
    return {
      data: {
        system: {
          uses,
        },
      },
      replaceActivityUses: true,
    };
  }

  get effects() {
    return [{
      name: "Dragon Wings",
      options: {
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("60", 2, "system.attributes.movement.fly"),
      ],
    }];
  }

}
