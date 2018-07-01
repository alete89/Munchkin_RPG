const chalk = require('chalk')
const log = x => console.log(chalk.green(x))
const {Race, Class, Equipment} = require('./cards')

class Player {
  constructor(name, game) {
    this.name = name
    this.level = 1
    this.run = 0
    this.bonus = 0
    this.maxInventory = 5
    this.race = null //new Race('Human', 'no image', () => {}, () => {})
    this.class = null //new Class('Commoner', 'no image', () => {}, () => {})
    this.isActive = false
    this.equipment = {
      head: null, //new Equipment('Bare', 'no image', 'head', () => {}, () => {}),
      torso: null, //new Equipment('Bare', 'no image', 'torso', () => {}, () => {}),
      feet: null, //new Equipment('Bare', 'no image', 'feet', () => {}, () => {}),
      misc: [],
      hands: [],
      numHands: 0
    }
    this.allEquips = []
    this.hand = []
    this.equip = this.equip.bind(this)
    this.unequip = this.unequip.bind(this)
    this.levelUp = this.levelUp.bind(this)
    this.die = this.die.bind(this)
    this.game = game
    this.inBattle = false
  }

  get attack() {
    return this.level + this.bonus
  }

  draw(deck) {
    this.hand.push(deck.draw())
  }

  gift(cardIdx, recipient) {
    const card = this.hand[cardIdx]
    this.hand.splice(cardIdx, 1)
    recipient.hand.push(card)
  }

  equip(cardIdx) {
    const item = this.hand[cardIdx]
    switch (item.type) {
      case 'Equipment':
        if (item.bodyPart === 'hands') {
          if (this.equipment.numHands + item.numHands > 2) {
            while (this.equipment.hands.length) {
              this.unequip(this.equipment.hands[0])
            }
          }
          this.equipment.hands.push(item)
          this.allEquips.push(item)
          this.equipment.numHands += item.numHands
        } else if (item.bodyPart === 'misc') {
          this.equipment.misc.push(item)
          this.allEquips.push(item)
        } else {
          if (this.equipment[item.bodyPart]) {
            this.unequip(this.equipment[item.bodyPart])
          }
          this.equipment[item.bodyPart] = item
          this.allEquips.push(item)
        }
        item.effect(this)
        this.hand.splice(cardIdx, 1)
        break
      case 'Class':
        if (this.class) {
          this.unequip(this.class)
        }
        this.class = item
        this.allEquips.push(item)
        item.effect(this)
        this.hand.splice(cardIdx, 1)
        break
      case 'Race':
        if (this.race) {
          this.unequip(this.race)
        }
        this.race = item
        this.allEquips.push(item)
        item.effect(this)
        this.hand.splice(cardIdx, 1)
        break
      default:
        log('You cannot equip this item!')
    }
  }

  unequip(item) {
    if (!item) return null
    switch (item.type) {
      case 'Equipment':
        const {bodyPart} = item
        if (bodyPart === 'hands' || bodyPart === 'misc') {
          this.equipment[bodyPart].splice(
            this.equipment[bodyPart].indexOf(item),
            1
          )
          this.equipment.numHands -= item.numHands
        } else {
          this.equipment[bodyPart] = null
        }
        this.allEquips.splice(this.allEquips.indexOf(item), 1)
        break
      case 'Class':
        this.class = null
        this.allEquips.splice(this.allEquips.indexOf(item), 1)
        break
      case 'Race':
        this.race = null
        this.allEquips.splice(this.allEquips.indexOf(item), 1)
        break
      default:
        log('You cannot equip this item!')
    }
    this.hand.push(item)
    item.remove(this)
  }

  cast(cardIdx, target) {
    const card = this.hand[cardIdx]
    if (card.type === 'Spell') {
      card.effect(target)
      this.hand.splice(cardIdx, 1)
    } else log('You cannot cast this item as a spell!')
  }

  levelUp() {
    this.level++
    log(this.name + ' went up one level!')
    if (this.level === 10) this.game.endGame(this.name)
  }

  die() {
    let i = 0
    while (this.hand.length) {
      let player = this.game.players[i]
      if (player !== this) player.draw(this.hand.pop())
      i++
    }
    Object.assign(this, new Player(this.name))
  }
}

module.exports = Player
