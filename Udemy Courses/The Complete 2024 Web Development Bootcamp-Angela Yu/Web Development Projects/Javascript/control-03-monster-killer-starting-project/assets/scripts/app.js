let chosenMaxLife = 100;
const ATTACK_VALUE = 10;
const STRONG_ATTACK_VALUE = 17;
const MONSTER_ATTACK_VALUE = 14;
let currentMonsterHealth = chosenMaxLife;
let currentPlayerHealth = chosenMaxLife;
const HEAL_VALUE = 20;
adjustHealthBars(chosenMaxLife) ;

function  attackHandler() {
    attackMonster("ATTACK");
}

function strongAttackHandler() {
    attackMonster("STRONG_ATTACK_VALUE");
}

function attackMonster(mode) {
    let maxDamage;
    if(mode === "ATTACK") {
        maxDamage=ATTACK_VALUE;
    } else {
        maxDamage =STRONG_ATTACK_VALUE;
    }
    const damage = dealMonsterDamage(MONSTER_ATTACK_VALUE);
    currentMonsterHealth -= damage;
    const monsterDamage = dealPlayerDamage(maxDamage);
    currentPlayerHealth -= monsterDamage;
    endRound();
}

function endRound() {
    if(currentMonsterHealth <= 0 && currentPlayerHealth > 0) {
        alert("You won!");
    } else if(currentPlayerHealth <= 0 && currentMonsterHealth > 0) {
        alert("You lose!");
    } else if(currentPlayerHealth <= 0 && currentMonsterHealth <= 0) {
        alert("It's a draw");
    }
}

function healPlayerHandler() {
    let healValue ;
    if(currentPlayerHealth >= chosenMaxLife-HEAL_VALUE) {
       alert("You can't heal more  than intital health");
       healValue = chosenMaxLife - currentPlayerHealth;
    } else {
        healValue = HEAL_VALUE;
    }
    increasePlayerHealth(healValue);
    currentPlayerHealth += healValue;
    endRound();
}

attackBtn.addEventListener("click",attackHandler);
strongAttackBtn.addEventListener("click", strongAttackHandler);
healBtn.addEventListener("click", healPlayerHandler);