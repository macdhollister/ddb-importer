// "creatureSizes": [{
//   "id": 2,
//   "entityTypeId": 127108918,
//   "name": "Tiny",
//   "weightType": 1
// }, {

//   "traits": {
//     "size": "grg",
//     "sizeId": 7,

import { DICTIONARY, SETTINGS } from '../../config/_module.mjs';
import { logger } from '../../lib/_module.mjs';
import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype.getSizeFromId = function getSizeFromId(sizeId) {
  const size = CONFIG.DDB.creatureSizes.find((s) => s.id == sizeId).name;
  const sizeData = DICTIONARY.sizes.find((s) => size == s.name);

  if (!sizeData) {
    logger.warn(`No foundry size found for "${size}" (${this.name}), using medium`);
    return { name: "Medium", value: "med", size: 1 };
  }
  return sizeData;
};

DDBMonster.prototype._generateSize = function _generateSize () {
  const sizeData = this.getSizeFromId(this.source.sizeId);
  const flatScale = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-size-flat-scale");
  const token = {
    scale: flatScale ? 1 : (sizeData.size >= 1 ? 1 : sizeData.size),
    value: flatScale ? sizeData.size : (sizeData.size >= 1 ? sizeData.size : 1),
  };

  this.npc.system.traits.size = sizeData.value;
  this.npc.prototypeToken.width = token.value;
  this.npc.prototypeToken.height = token.value;
  this.npc.prototypeToken.texture.scaleX = token.scale;
  this.npc.prototypeToken.texture.scaleY = token.scale;

};
