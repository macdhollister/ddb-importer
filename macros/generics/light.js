// console.warn(scope)

const parentActor = (typeof actor !== 'undefined')
  ? actor
  : undefined;

const caster = (typeof token !== 'undefined')
  ? token
  : undefined;

if (!parentActor) {
  ui.notifications.error("No parent actor found");
  return;
}

const origin = item;

const scopeParameters = JSON.parse(scope.parameters ?? "\{\}");
const flag = scopeParameters.flag ?? "light";
const flagData = foundry.utils.getProperty(parentActor, `flags.world.${flag}`);

const darkness = scopeParameters.darkness ?? false;
const lightConfig = scopeParameters.lightConfig ?? {};
const targetsToken = scopeParameters.targetsToken ?? false;
const distance = scopeParameters.distance ?? 15;

const isOn = !flagData?.active ?? true;
const isOff = flagData?.active ?? false;
const forceOn = scopeParameters.forceOn ?? false;

const isSimpleDDBMacro = scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction");

console.debug("MACRO CALL", {
  scope,
  isSimpleDDBMacro,
  isOn,
  isOff,
  flagData,
  targetsToken,
  distance,
  lightConfig,
  scopeParameters,
  darkness,
  parentActor,
  caster,
  origin,
});

async function placeTemplate({ origin, parentActor, distance, flag } = {}) {
  Hooks.once("createMeasuredTemplate", async (template) => {
    let radius = canvas.grid.size * (template.distance / canvas.grid.distance);
    const params = {
      radius,
      x: template.x,
      y: template.y,
      distance: template.distance,
      parentActorId: parentActor.id,
      lightConfig,
      darkness,
      isTemplate: true,
      flag,
    };
    await parentActor.update({
      [`flags.world.${flag}`]: {
        active: true,
        params,
      },
    });
    await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
    await DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { origin: origin.uuid }, { toggle: "on", parameters: params });
  });

  const measureTemplateData = {
    t: "circle",
    user: game.userId,
    distance,
    direction: 0,
    x: 0,
    y: 0,
    fillColor: game.user.color,
    flags: {
      spellEffects: {
        Light: {
          ActorId: parentActor.id,
        },
      },
    },
  };

  const doc = new CONFIG.MeasuredTemplate.documentClass(measureTemplateData, { parent: canvas.scene });
  const measureTemplate = new game.dnd5e.canvas.AbilityTemplate(doc);
  measureTemplate.actorSheet = parentActor.sheet;
  measureTemplate.drawPreview();
}

// const position = await DDBImporter.lib.Crosshairs.aimCrosshair({
//   drawBoundries: false,
//   trackDistance: false,
// });


async function removeLight() {
  ui.notifications.info("Attempting to remove previous casting effects");

  DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { actor: parentActor._id }, {
    toggle: "off",
    parameters: flagData.params,
  });
  await parentActor.update({
    [`flags.world.${flag}`]: {
      active: false,
      params: null,
    },
  });
}

async function createLight() {
  if (targetsToken) {

    const targetTokenUuids = scopeParameters.targetsSelf && caster
      ? [caster.uuid]
      : scope.targetUuids ?? Array.from(game.user.targets).map((t) => t.document.uuid);
    const params = {
      parentActorId: parentActor.id,
      lightConfig,
      darkness,
      targetsToken: true,
      flag,
      targetTokenUuids: targetTokenUuids,
    };

    if (targetTokenUuids.length === 0) {
      ui.notifications.warn('Please target a token to apply the light effect to and try again.');
      return;
    }

    await parentActor.update({
      [`flags.world.${flag}`]: {
        active: true,
        params,
      },
    });
    DDBImporter.lib.DDBMacros.executeDDBMacroAsGM(
      "gm",
      "light",
      { actor: parentActor._id },
      { toggle: "on", parameters: params },
    );
  } else {
    await placeTemplate({ origin, parentActor, distance, flag });
  }

}

if (isOff) {
  await removeLight();
  if (forceOn) {
    await createLight();
  }
} else if (isOn) {
  await createLight();
}

