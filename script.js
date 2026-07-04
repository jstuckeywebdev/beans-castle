const stockCards = ['Ace','2','3','4','5','6','7','8','9','10','Jack','Queen','King'];

function rollDice(n){
    let result = 0;
    for(let i = 0; i < n; i++){
        let roll = (Math.floor(Math.random() * 6) + 1);
        result += roll;
    }
    return result; 
}

function getDistance(){
    let distanceStr = prompt('How many empty spaces are in between the attacker and target?');
    let distance = parseInt(distanceStr);

    if(distanceStr === null){
        return null;
    }

    if(distanceStr === ''){
        distance = 0;
    }
    
    while(isNaN(distance) || distance < 0){
        alert("Invalid number entered.");
        distanceStr = prompt("How many empty spaces are in between the attacker and target?");
        if(distanceStr == ''){
            distance = 0;
        } else {
            distance = parseInt(distanceStr);
        }
    }
    return distance;
} 

function getCardValue(card){
    if (card === 'Ace') return 1;
    if (card === 'Jack') return 11;
    if (card === 'Queen') return 12;
    if (card === 'King') return 13;
    return parseInt(card);
}

function logMessage(message, mobileNotification){
    const logWindow = document.getElementById("log-window");
    const newPElement = document.createElement("p");
    const newHR = document.createElement('hr')
    newPElement.innerHTML = message;
    newPElement.append(newHR);
    logWindow.insertBefore(newPElement, logWindow.firstChild);
    saveGameState();
    if(mobileNotification == null){
        mobileNotification = true;
    }

    // Show mobile notification
    if(mobileNotification == true){
        const notification = document.getElementById('mobileNotification');
        if (notification && window.innerWidth < 768) { // Mobile check
          notification.innerHTML = message;
          notification.classList.add('show');
      
          // Remove it after 3 seconds
          setTimeout(() => {
            notification.classList.remove('show');
          }, 3000);
        }
    }
}

function saveGameState() {
    const logWindow = document.getElementById('log-window');
    const logHTML = logWindow.innerHTML;

    const state = {
        party: partyMembers.map(member => ({
            slug: member.slug,
            hp: member.hp,
            isAlive: member.isAlive,
            guardAmount: member.guardAmount || 0,
            isGuarding: member.isGuarding || false
        })),
        enemies: enemies.map(enemy => ({
            slug: enemy.slug,
            hp: enemy.hp,
            isAlive: enemy.isAlive
        })),
        decks: {
            hearts: heartsDeck.index,
            clubs: clubsDeck.index,
            spades: spadesDeck.index,
            diamonds: diamondsDeck.index
        },
        log: logHTML
    };
    localStorage.setItem('gameState', JSON.stringify(state));

}

function loadGameState() {
    const saved = localStorage.getItem('gameState');
    if (!saved) return;

    let state;
    try {
        state = JSON.parse(saved);
    } catch (e) {
        localStorage.removeItem('gameState');
        return;
    }

    state.party.forEach(savedMember => {
        const member = partyMembers.find(m => m.slug === savedMember.slug);
        if (member) {
            member.hp = savedMember.hp;
            member.isAlive = savedMember.isAlive;
            member.guardAmount = savedMember.guardAmount || 0;
            member.isGuarding = savedMember.isGuarding || false;
        }
    });

    state.enemies.forEach(savedEnemy => {
        const enemy = enemies.find(e => e.slug === savedEnemy.slug);
        if (enemy) {
            enemy.hp = savedEnemy.hp;
            enemy.isAlive = savedEnemy.isAlive;
        }
    });

    heartsDeck.index = state.decks.hearts;
    clubsDeck.index = state.decks.clubs;
    spadesDeck.index = state.decks.spades;
    diamondsDeck.index = state.decks.diamonds;

    // Restore health and state visually
    partyMembers.forEach(member => {
        const savedMember = state.party.find(m => m.slug === member.slug);
        if (savedMember) {
            member.updateHP(savedMember.hp);
            member.checkIfAlive();
        }
    });

    enemies.forEach(enemy => {
        const savedEnemy = state.enemies.find(e => e.slug === enemy.slug);
        if (savedEnemy) {
            enemy.updateHP(savedEnemy.hp);
            enemy.checkIfAlive();
        }
    });

    // Restore log content
    if (state.log) {
        const logWindow = document.getElementById('log-window');
        logWindow.innerHTML = state.log;
    }
}

function generateMap(){
    const numOfWalls = 16;
    let wallsPlaced = 0;
    let message = '<center>PLACE THE ENEMY KING</center>Place the Enemy King in tile H8 (top-right)<br /><hr /><br /><center>PLACE WALLS:</center><em>Walls are placed from right to left, top to bottom. Walls may not be placed orthogonally adjacent</em><br /><br />';
   
    while (wallsPlaced < numOfWalls) {
        let emptySpaces = rollDice(1);
        if(emptySpaces == 1){
            message += `Leave ${emptySpaces} empty space<br />`;
        } else {
            message += `Leave ${emptySpaces} empty spaces<br />`;
        }
        let wallSegment = rollDice(1);
        if (wallsPlaced + wallSegment > numOfWalls) {
            wallSegment = numOfWalls - wallsPlaced;
        }

        wallsPlaced += wallSegment;

        if(wallSegment == 1){
            message += `Place ${wallSegment} wall<br />`;
        } else {
            message += `Place ${wallSegment} walls<br />`;
        }
    }

    message += '<hr /><br /><center>PLACE ENEMIES:</center><em>Enemies are placed starting with tile H8, from right to left, top to bottom. Count ALL tiles, if an enemy would go on an occupied space, continue on until a valid space is found</em><br />'
    
    const placementOrder = [...enemies];
    for (let i = placementOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [placementOrder[i], placementOrder[j]] = [placementOrder[j], placementOrder[i]];
    }

    placementOrder.forEach(enemy => {
        let spaces = rollDice(1);
        if(enemy.slug !== 'bKing'){
            message += `<br />Count ${spaces} spaces then place ${enemy.name}`;
        }
    });

    logMessage(message,false);
}

class Deck {
    constructor(suit){
        this.suit = suit;
        this.cards = [...stockCards];
        this.index = 0;
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    pullCard() {
        let card = this.cards[this.index];
        this.index++;
        if(this.index == 13){
            this.index = 0;        
        }
        return card;
    }    
}

class Entity {
    constructor(name, slug, hp, isRanged, imageSrc){
        this.name = name;
        this.slug = slug;
        this.hp = hp;
        this.maxHp = hp;
        this.isAlive = true;
        this.isRanged = isRanged;
        this.imageSrc = imageSrc;
    }

    updateHP(newHP){
        this.hp = newHP;
        document.getElementById(this.slug + 'HP').textContent = this.hp;
    }

    checkIfAlive(){
        if (this.hp <= 0){
            this.isAlive = false;
            this.hp = 0;
            document.getElementById(this.slug + 'HP').textContent = "DEAD";
        }
    }
}

class PartyMember extends Entity {
    constructor(name, slug, suit, hp, isRanged, abilityDescription, imageSrc, abilityBtnText){
        super(name, slug, hp, isRanged, imageSrc);
        this.suit = suit;
        this.abilityDescription = abilityDescription;
        this.abilityBtnText = abilityBtnText;
        this.pendingAttackCard = null;
    }

    resetAttackMode(){
        this.pendingAttackCard = null;
        partyMembers.forEach(partyMember => {
            partyMember.unhideMainBtns();
        });
        enemies.forEach(enemy => {
            document.getElementById(enemy.slug + 'TargetBtn').classList.add('d-none');
            if(enemy.slug !== 'bKing'){
                document.getElementById(enemy.slug + 'DirectionBtn').classList.remove('d-none');
            }
            enemy.isRangedTarget = false;
        });
    }

    checkIfAlive(){
        super.checkIfAlive();
        if (!this.isAlive) {
            document.getElementById(this.slug + 'DmgBtn').classList.add('d-none');
            document.getElementById(this.slug + 'AbilityBtn').classList.add('d-none');
        }
    }

    attackEnemy(target){
        let hp = target.hp;
        let newHP = hp;
        let damage;
        let distance = 0; 
        let card;
        let action;

        if (target.isRangedTarget){
            distance = getDistance();
            if (distance === null) {
                this.resetAttackMode();
                return;
            }
            card = this.pendingAttackCard || diamondsDeck.pullCard();
            this.pendingAttackCard = null;
            action = 'shoots';
        } else {
            card = clubsDeck.pullCard();
            action = 'strikes';
        }

        damage = getCardValue(card) - distance;
        if (damage < 0){
            damage = 0;
        }

        newHP = hp - damage;
        target.hp = newHP;

        target.checkIfAlive();
        
        logMessage(`${this.name} ${action} ${target.name} for ${damage} damage.`)

        if(!target.isAlive){
            logMessage(`${this.name} killed ${target.name}`);
        } else {
            target.updateHP(newHP);
        }

        this.resetAttackMode();
    }

    displayPartyMember(){
        const newDiv = document.createElement('div');
        newDiv.id = this.slug + 'Card';
        newDiv.classList.add('card', 'partyMemberCard');

        const header = document.createElement('div');
        header.classList.add('entity-header');

        const name = document.createElement('h4');
        name.textContent = this.name;

        const hp = document.createElement('p');
        hp.classList.add('partyMemberHP');
        hp.id = this.slug + 'HP';
        hp.textContent = this.hp;

        header.appendChild(name);
        header.appendChild(hp);

        const portrait = document.createElement('div');
        portrait.classList.add('entity-portrait');

        const newImg = document.createElement('img');
        newImg.src = this.imageSrc;
        newImg.alt = this.name;
        newImg.classList.add('partyMemberImg');
        portrait.appendChild(newImg);

        const actions = document.createElement('div');
        actions.classList.add('entity-actions');

        const abilityBtn = document.createElement('a');
        abilityBtn.id = this.slug + 'AbilityBtn';
        abilityBtn.classList.add('btn', 'btn-primary', 'mainPartyMemberBtns');
        if(this.slug == 'wKnight' || this.slug == 'wBishop'){
            abilityBtn.href='#enemy-window';
        }
        abilityBtn.onclick = () => {
            this.useAbility();
        };
        abilityBtn.textContent = this.abilityBtnText;

        const dmgBtn = document.createElement('a');
        dmgBtn.id = this.slug + 'DmgBtn';
        dmgBtn.classList.add('btn', 'btn-danger');
        dmgBtn.onclick = () => {
            this.takeDamage();
        };
        dmgBtn.textContent = 'Roll for Damage';

        actions.appendChild(abilityBtn);
        actions.appendChild(dmgBtn);

        const partyWindow = document.getElementById('party-window');
        partyWindow.appendChild(newDiv);
        newDiv.appendChild(header);
        newDiv.appendChild(portrait);
        newDiv.appendChild(actions);
    }

    takeDamage(){
        let distance = getDistance();
        let damage = 0;
        if(distance === null){
            distance = 0;
        } else {
            damage = rollDice(2);
        }
        damage -= distance;
        

        if(this.slug == 'wRook'){
            const guardBtn = document.getElementById('wRookAbilityBtn');
            damage = damage - whiteRook.guardAmount;
            guardBtn.classList.remove('btn-secondary')
            guardBtn.classList.add('btn-primary');
            guardBtn.textContent = 'Guard';
            guardBtn.onclick = () => {
                this.useAbility();
            }
            whiteRook.guardAmount = 0;
        }


        if(damage < 0){
            damage = 0;
        }
        this.hp -= damage;
            
        if (this.hp <= 0){
            logMessage(this.name + " was KILLED");
            this.checkIfAlive();
        } else {
            document.getElementById(this.slug + 'HP').textContent = this.hp;
            logMessage(damage + " damage was dealt to the " + this.name + ". " + this.hp + " HP remains.");
        }
    }

    hideMainBtns(){
        if(this.isAlive){
            document.getElementById(this.slug + 'DmgBtn').classList.add('d-none');
            document.getElementById(this.slug + 'AbilityBtn').classList.add('d-none');
        }
    }

    unhideMainBtns(){
        partyMembers.forEach(member => {
            if(member.isAlive){
                document.getElementById(member.slug + 'DmgBtn').classList.remove('d-none');
                document.getElementById(member.slug + 'AbilityBtn').classList.remove('d-none');        
            }
        });
    }

    useAbility(){
        let card;
        let message;
        let healAmount;
        switch(this.slug){
            case 'wKing':
                card = heartsDeck.pullCard();
                healAmount = getCardValue(card);
                message = '';
                partyMembers.forEach(partyMember => {
                    const healBtn = document.createElement('a');
                    healBtn.id = partyMember.slug + 'HealBtn';
                    healBtn.classList.add('btn', 'btn-success');
                    if(partyMember.isAlive){
                        healBtn.textContent = "Heal";
                    } else {
                        healBtn.textContent = "Revive";
                    }
                    healBtn.onclick = () => {
                        partyMember.heal(partyMember, healAmount);
                        partyMember.unhideMainBtns(partyMember);
                    };
                    partyMember.hideMainBtns(partyMember);
                    document.getElementById(partyMember.slug + 'Card').querySelector('.entity-actions').appendChild(healBtn);
                });
                break;

            case 'wKnight':
                this.initializeAttack();
                break;

            case 'wRook':
                card = spadesDeck.pullCard();
                whiteRook.guardAmount = getCardValue(card);
                whiteRook.isGuarding = true;
                
                const abilityBtn = document.getElementById(this.slug + 'AbilityBtn');
                abilityBtn.textContent = 'Guarding for ' + whiteRook.guardAmount;
                abilityBtn.classList.add('btn-secondary');
                abilityBtn.classList.remove('btn-primary');
                abilityBtn.onclick = () => {

                }; 
                
                logMessage(this.name + ' guards for ' + whiteRook.guardAmount + '.');
                break;

            case 'wBishop':
                card = diamondsDeck.pullCard();
                const shootAmount = getCardValue(card);
                this.pendingAttackCard = card;
                this.initializeAttack();
                logMessage(this.name + ' shoots for ' + shootAmount + '.');
                break;
        }
    }

    initializeAttack(){
        enemies.forEach(enemy => {
            document.getElementById(enemy.slug + 'TargetBtn').classList.remove('d-none');
            if (this.isRanged){
                enemy.isRangedTarget = true;
            } 

            if(enemy.slug != 'bKing'){
                document.getElementById(`${enemy.slug}DirectionBtn`).classList.add('d-none');
            }
        });
    
        partyMembers.forEach(partyMember => {
            partyMember.hideMainBtns();
        });
    }
    
    heal(target, healAmount){
        const preHealHP = target.hp;
        let message = `${target.name} was healed for ${healAmount}.`;
        let wasRevived = false;
        if(!target.isAlive){
            healAmount = 1;
            target.isAlive = true;
            wasRevived = true;
            message = target.name + ' was revived!';
        }
        let newHP = preHealHP + healAmount;
        if (newHP > target.maxHp) {
            newHP = target.maxHp;
            healAmount = target.maxHp - preHealHP;
        }
        target.hp = newHP;

        document.getElementById(target.slug + 'HP').textContent = newHP;
        
        if(!wasRevived){
            message = `${target.name} was healed for ${healAmount}.`;
        }

        logMessage(message);
        partyMembers.forEach(member => {
            const healBtn = document.getElementById(member.slug + 'HealBtn');
            if (healBtn) {
                healBtn.remove();
            }
        });
    }
}

const whiteKing = new PartyMember("King", "wKing", "hearts", 15, false, 'Heals Allies', 'images/chessPieces/white-king.png', 'Heal');
const whiteKnight = new PartyMember("Knight", "wKnight", "clubs", 15, false, 'Deals Melee Damage', 'images/chessPieces/white-knight.png', 'Strike');
const whiteBishop = new PartyMember("Bishop", "wBishop", "diamonds", 15, true, 'Deals Ranged Damage', 'images/chessPieces/white-bishop.png', 'Shoot');
const whiteRook = new PartyMember("Rook", "wRook", "spades", 20, false, 'Draws Enemy attention and absorbs damage', 'images/chessPieces/white-rook.png', 'Guard');
    whiteRook.isGuarding = false;
    whiteRook.guardAmount = 0;
const partyMembers = [whiteKing, whiteRook, whiteKnight, whiteBishop];


class Enemy extends Entity {
    constructor(name, slug, hp, isRanged, canMove, imageSrc){
        super(name, slug, hp, isRanged, imageSrc);
        this.canMove = canMove;
        this.isRangedTarget = false;
        this.movementDirection = 0;
    }

    displayEnemy(){
        const newDiv = document.createElement('div');
        newDiv.id = this.slug + 'Card';
        newDiv.classList.add('card', 'enemyCard');

        const header = document.createElement('div');
        header.classList.add('entity-header');

        const name = document.createElement('h5');
        name.textContent = this.name;
        name.classList.add('enemyName');

        const hp = document.createElement('p');
        hp.classList.add('enemyHP');
        hp.id = this.slug + 'HP';
        hp.textContent = this.hp;

        header.appendChild(name);
        header.appendChild(hp);

        const portrait = document.createElement('div');
        portrait.classList.add('entity-portrait');

        const newImg = document.createElement('img');
        newImg.src = this.imageSrc;
        newImg.alt = this.name;
        newImg.classList.add('enemyImg');
        portrait.appendChild(newImg);

        const actions = document.createElement('div');
        actions.classList.add('entity-actions');

        const targetBtn = document.createElement('a');
        targetBtn.classList.add('btn', 'btn-danger', 'd-none');
        targetBtn.href = '#party-window';
        targetBtn.textContent = 'Target';
        targetBtn.id = this.slug + 'TargetBtn';
        targetBtn.onclick = () => {
            if (whiteBishop.isRanged && this.isRangedTarget) {
                whiteBishop.attackEnemy(this);
            } else {
                whiteKnight.attackEnemy(this);
            }
        };

        const rollForDirectionBtn = document.createElement('a');
        rollForDirectionBtn.classList.add('btn', 'btn-warning');
        rollForDirectionBtn.id = `${this.slug}DirectionBtn`;
        rollForDirectionBtn.textContent = 'Roll For Direction';
        rollForDirectionBtn.onclick = () => {
            this.rollForDirection();
        };

        actions.appendChild(targetBtn);
        if(this.slug != 'bKing'){
            actions.appendChild(rollForDirectionBtn);
        }

        const enemyWindow = document.getElementById('enemy-window');
        enemyWindow.appendChild(newDiv);
        newDiv.appendChild(header);
        newDiv.appendChild(portrait);
        newDiv.appendChild(actions);
    }

    rollForDirection(){
        const directionValue = rollDice(2);
        let direction;

        switch(directionValue){
            case 2:
                direction = "Northeast";
                break;
            case 3:
                direction = "East";
                break;
            case 4:
            case 5:
                direction = "Southeast";
                break;
            case 6: 
                direction = "South";
                break;
            case 7:
            case 8: 
                direction = "Southwest";
                break;
            case 9:
                direction = "West";
                break;
            case 10:
            case 11:
                direction = "Northwest";
                break;
            case 12:
                direction = "North";
                break;
        }
    logMessage(`${this.name} tries to move ${direction} (rolled ${directionValue})`);
    }
}

const blackRook1 = new Enemy("Rook 1", 'bRook1', 30, false, true, 'images/chessPieces/black-rook.png');
const blackRook2 = new Enemy("Rook 2", 'bRook2', 30, false, true, 'images/chessPieces/black-rook.png');
const blackKnight1 = new Enemy("Knight 1", 'bKnight1', 20, false, true, 'images/chessPieces/black-knight.png');
const blackKnight2 = new Enemy("Knight 2", 'bKnight2', 20, false, true, 'images/chessPieces/black-knight.png');
const blackBishop1 = new Enemy("Bishop 1", 'bBishop1', 20, true, false, 'images/chessPieces/black-bishop.png');
const blackBishop2 = new Enemy("Bishop 2", 'bBishop2', 20, true, false, 'images/chessPieces/black-bishop.png');
const blackQueen = new Enemy("Queen", 'bQueen', 40, false, true, 'images/chessPieces/black-queen.png');

class Boss extends Enemy {
    constructor(name, slug, hp, imageSrc){
        super(name, slug, hp, true, true, imageSrc)
    }
}

const blackKing = new Boss("King", 'bKing', 50, 'images/chessPieces/black-king.png');
const enemies = [blackBishop1, blackBishop2, blackKnight1, blackKnight2, blackRook1, blackRook2, blackQueen, blackKing];

const heartsDeck = new Deck('hearts');
heartsDeck.shuffle();
const clubsDeck = new Deck('clubs');
clubsDeck.shuffle();
const spadesDeck = new Deck('spades');
spadesDeck.shuffle();
const diamondsDeck = new Deck('diamonds');
diamondsDeck.shuffle();

partyMembers.forEach(partyMember => {
    partyMember.displayPartyMember();
});

enemies.forEach(enemy => {
    enemy.displayEnemy();
});

document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
});
