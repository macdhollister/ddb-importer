/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable require-atomic-updates */
import DICTIONARY from "../dictionary.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import logger from "../logger.js";
import SETTINGS from "../settings.js";

const DDB_FLAGS_TO_REMOVE = [
  "midi-qol",
  "midiProperties",
  "ActiveAuras",
  "dae",
  "itemacro",
];

const CP_FLAGS_TO_REMOVE = [
  "cf",
  "ddbimporter",
  "monsterMunch",
  "core",
];

const CP_FIELDS_TO_COPY = [
  "effects",
  "system.damage",
  "system.target",
  "system.range",
  "system.duration",
  "system.save",
  "system.activation",
  "system.ability",
  "system.critical",
  "system.formula",
  "system.actionType",
];

export async function getChrisCompendium(type) {
  const compendiumName = SETTINGS.CHRIS_PREMADES_COMPENDIUM.find((c) => c.type === type);
  const cpPack = CompendiumHelper.getCompendium(compendiumName);
  const indices = ["name", "type", "flags.cf"];
  const index = await cpPack.getIndex({ fields: indices });
  return index;
}


async function getFolderId(name, type, compendiumName) {
  const folderAPI = game.CF.FICFolderAPI;
  const allFolders = await folderAPI.loadFolders(compendiumName);
  return allFolders.find((f) => f.name === name)?.id;
}


export async function applyChrisPremadeEffect(document, type, folderName = null) {
  if (!game.modules.get("chris-premades")?.active) return document;
  const compendiumName = SETTINGS.CHRIS_PREMADES_COMPENDIUM.find((c) => c.type === type)?.name;
  if (!compendiumName) return document;
  const ddbName = document.flags.ddbimporter?.originalName ?? document.name;
  const chrisName = CONFIG.chrisPremades?.renamedItems[ddbName] ?? ddbName;
  const folderId = type === "monsterfeatures"
    ? await getFolderId(folderName ?? chrisName, type, compendiumName)
    : undefined;

  const chrisDoc = await chrisPremades.helpers.getItemFromCompendium(compendiumName, chrisName, true, folderId);
  if (!chrisDoc) return document;

  DDB_FLAGS_TO_REMOVE.forEach((flagName) => {
    delete document.flags[flagName];
  });

  document.effects = [];

  CP_FLAGS_TO_REMOVE.forEach((flagName) => {
    delete chrisDoc.flags[flagName];
  });

  document.flags = mergeObject(document.flags, chrisDoc.flags);

  CP_FIELDS_TO_COPY.forEach((field) => {
    setProperty(document, field, getProperty(chrisDoc, field));
  });

  setProperty(document, "flags.ddbimporter.effectsApplied", true);
  setProperty(document, "flags.ddbimporter.chrisEffectsApplied", true);
  logger.debug(`Updated ${document.name} with a Chris effect`);

  return document;
}


export async function applyChrisPremadeEffects(documents, compendiumItem = false, force = false) {
  if (!game.modules.get("chris-premades")?.active) return documents;

  const applyChrisEffects = force || compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-use-chris-premades")
    : game.settings.get("ddb-importer", "character-update-policy-use-chris-premades");
  if (!applyChrisEffects) return documents;

  for (let doc of documents) {
    let type = doc.type;

    if (["class", "subclass", "background"].includes(type)) continue;
    if (DICTIONARY.types.inventory.includes(doc.type)) {
      type = "inventory";
    }

    doc = await applyChrisPremadeEffect(doc, type);
  }

  return documents;
}

export async function addAndReplaceRedundantChrisDocuments(actor, folderName = null) {
  if (!game.modules.get("chris-premades")?.active) return;
  logger.debug("Beginning additions and removals of extra effects.");
  const documents = actor.getEmbeddedCollection("Item").toObject();
  const toAdd = [];
  const toDelete = [];

  for (let doc of documents) {
    let type = doc.type;

    if (["class", "subclass", "background"].includes(type)) continue;
    const compendiumName = SETTINGS.CHRIS_PREMADES_COMPENDIUM.find((c) => c.type === type)?.name;
    if (!compendiumName) continue;
    if (DICTIONARY.types.inventory.includes(doc.type)) {
      type = "inventory";
    }

    const ddbName = doc.flags.ddbimporter?.originalName ?? doc.name;
    const chrisName = CONFIG.chrisPremades?.renamedItems[ddbName] ?? ddbName;
    const newItemNames = getProperty(CONFIG, `chrisPremades.additionalItems.${chrisName}`);

    if (newItemNames) {
      logger.debug(`Adding new items for ${chrisName}`);
      const folderId = type === "monsterfeatures"
        ? await getFolderId(folderName ?? chrisName, type, compendiumName)
        : undefined;

      for (const newItemName of newItemNames) {
        logger.debug(`Adding new item ${newItemName}`);
        const chrisDoc = await chrisPremades.helpers.getItemFromCompendium(compendiumName, newItemName, true, folderId);
        if (!documents.find((d) => d.name === chrisDoc.name)) toAdd.push(chrisDoc);
      }
    }

    const itemsToRemoveNames = getProperty(CONFIG, `chrisPremades.removedItems.${chrisName}`);
    if (itemsToRemoveNames) {
      logger.debug(`Removing items for ${chrisName}`);
      for (const removeItemName of itemsToRemoveNames) {
        logger.debug(`Removing item ${removeItemName}`);
        const deleteDoc = documents.find((d) => d.name === removeItemName);
        if (deleteDoc) toDelete.push(deleteDoc._id);
      }
    }
  }

  logger.debug("Final Chris's Premades list", {
    toDelete,
    toAdd,
  });
  await actor.deleteEmbeddedDocuments("Item", toDelete);
  await actor.createEmbeddedDocuments("Item", toAdd);

}

export async function addChrisEffectsToActorDocuments(actor) {
  if (!game.modules.get("chris-premades")?.active) {
    ui.notifications.error("Chris Premades module not installed");
    return;
  }

  logger.info("Starting to update actor documents with Chris Premades effects");
  let documents = actor.getEmbeddedCollection("Item").toObject();
  const data = await applyChrisPremadeEffects(documents, false, true);
  await actor.updateEmbeddedDocuments("Item", data);
  await addAndReplaceRedundantChrisDocuments(actor);
  logger.info("Effect replacement complete");
}
