const MAX_COND_WIDTH = 4;
const MAX_ACTION_WIDTH = 2;
const MAX_CLASSIFIERS = 32;
const MAX_EPISODE = 10;

function classifier_t(){
    this.condition = [];
    this.action = [];
    this.strength = [];
    this.specificity=0;
    this.bid=0 ;
    this.match=0;
    this.episode=0;
    return this;
}
let list={};
for(let i=0;i<MAX_CLASSIFIERS;i++){
    list[i]=new classifier_t();
}
const MAX_WORLD_X =20;
const MAX_WORLD_Y =20;

const MAX_OBSTACLES = 100;

const RISK_FACTOR = 0.5;
const MAX_DIR = 4;

function dir_t(x,y){
    this.loc_y=y;
    this.loc_x=x;
    return this;
}

const REWARD = 1.0;

let world =[];
for(let i=0;i<MAX_WORLD_X;i++) {
    world[i]=[];
    for (let j = 0; j < MAX_WORLD_Y; j++)
        world[i][j] = ' ';
}
let agent_y,agent_x;

let dir = [new dir_t(-1,0), new dir_t(0,1), new dir_t(1,0),new dir_t(0,-1),new dir_t(0,0)];



function initWorld(){



    for (let x = 0 ; x < MAX_WORLD_X ; x++) {
        world[0][x] = '*';
        world[MAX_WORLD_Y-1][x] = '*';
    }
    for (let y = 0 ; y < MAX_WORLD_Y ; y++) {
        world[y][0] = '*';
        world[y][MAX_WORLD_X-1] = '*';
    }


    let i = 0;
    while (i < MAX_OBSTACLES) {
        let y = Math.floor(Math.random() * MAX_WORLD_Y);
        let x = Math.floor(Math.random() * MAX_WORLD_X);

        if (world[y][x] !== '*') {
            world[y][x] = '*';
            i++;
        }
    }


}

function initAgent(){
    let i,c;
    for(c=0;c<MAX_CLASSIFIERS;c++){
        initClassifier(c);
    }

    while(true){
        agent_y = 1+ Math.floor(Math.random() * MAX_WORLD_Y-2);
        agent_x = 1+ Math.floor(Math.random() * MAX_WORLD_X-2);
        if(world[agent_y][agent_x]==='*')
            continue;

        for(i=0;i<MAX_DIR;i++){
            let y = agent_y + dir[i].loc_y;
            let x = agent_x + dir[i].loc_x;

            if(world[y][x]==='*')
                break;
        }

        if(i==MAX_DIR)
            break;
    }

    world[agent_y][agent_x] = '@';
    return;
}

function initClassifier(classifier) {
    let cond, act;
    for (cond = 0; cond < MAX_COND_WIDTH; cond++) {
        list[classifier].condition[cond] = getRandomCharacter();
    }
    for (act = 0; act < MAX_ACTION_WIDTH; act++) {
        list[classifier].action[act] = String.fromCharCode(0x30 + Math.random()*2);
    }
    list[classifier].strength = 1.0;
    list[classifier].episode = 0;
    calculateSpecificity(classifier);
}

function getRandomCharacter() {
    const alphabet = ['0', '1', '#'];
    return alphabet[Math.floor(Math.random() * 3)];
}

function calculateSpecificity(classifier){
    let i;
    list[classifier].specificity = 0.0;

    for(i=0;i<MAX_COND_WIDTH;i++)
        if(list[classifier].condition[i] != '#')
            list[classifier].specificity++;

    list[classifier].specificity /= MAX_COND_WIDTH;

    return;
}

function readDetectors(condition){
    let i;
    for(i=0;i<MAX_DIR;i++){
        let y = agent_y + dir[i].loc_y;
        let x = agent_x + dir[i].loc_x;
        condition[i] = (world[y][x]=='*') ? '1' : '0';
    }
    return;
}

function matchClassifiers(condition){
    let c,i,bidSum=0,matchFound;

    for(c=0;c<MAX_CLASSIFIERS;c++){
        list[c].match = 0;

        for(i=0;i<MAX_COND_WIDTH;i++)
            if(!match(list[c].condition[i],condition[i]))
                break;

        if(i==MAX_COND_WIDTH){
            list[c].match = 1;
            list[c].bid = RISK_FACTOR * list[c].strength * list[c].specificity;
            bidSum+=list[c].bid;
            matchFound=1;
        }
    }

    if(matchFound){
        let tries = MAX_CLASSIFIERS;
        c = Math.floor(Math.random()*MAX_CLASSIFIERS);
        while(true){
            if(list[c].match){
                if(list[c].bid / bidSum > Math.random())
                    break;
                if(--tries==0)
                    break;
            }

            if(++c>=MAX_CLASSIFIERS)
                c=0;
        }
    }else{
        if(c==MAX_CLASSIFIERS){
            c= createCoveringClassifier(-1,condition);
        }
    }
    return c;
}

function match(cl,cn){
    if(cl=='#')
        return true;
    else if(cl==cn)
        return true;

    return false;
}

function createCoveringClassifier(classifier,condition){
    let c,act;
    let minStrength = 99.0;

    if(classifier==-1){

        for(c=0;c<MAX_CLASSIFIERS;c++){
            if(list[c].strength < minStrength){
                classifier = c;
                minStrength = list[c].strength;
            }
        }
    }

    for(c=0;c<MAX_COND_WIDTH;c++){
        if(Math.random() > 0.75) {
            list[classifier].condition[c] = condition[c];
        }else{
            list[classifier].condition[c]='#';
        }


    }

    for(act=0;act<MAX_ACTION_WIDTH;act++){
        list[classifier].action[act] = 0x30 + Math.floor(Math.random()*2);

    }

    list[classifier].strength=1.0;
    list[classifier].episode=0;
    calculateSpecificity(classifier);

    return classifier;

}

function sendEffectors(classifier) {
    let i, x, y;
    let act = 0;
    for (i = MAX_ACTION_WIDTH - 1; i >= 0; i--) {
        if (list[classifier].action[i] == '1') {
            act = MAX_ACTION_WIDTH - 1 - i;
        }
    }
    y = agent_y + dir[act].loc_y;
    x = agent_x + dir[act].loc_x;
    console.log(world[y][x],y,x);
    if (world[y][x] == ' ') {
        world[agent_y][agent_x] = ' ';
        // Classifier led to a successful move, increase the strength
        // of this classifier and move the agent to its new position.
        agent_y = y;
        agent_x = x;

        list[classifier].strength += REWARD;
        list[classifier].episode = 1;
        world[agent_y][agent_x] = '@';
    } else {
        // Classifier was bad, replace it with a new one.
        createCoveringClassifier(classifier, list[classifier].condition);
    }
}


function printAgent() {
    let c, cond, act;
    console.log("\nClassifier List:\n");
    for (c = 0; c < MAX_CLASSIFIERS; c++) {
        let condition = "";
        for (cond = 0; cond < MAX_COND_WIDTH; cond++) {
            condition += list[c].condition[cond];
        }
        let action = "";
        for (act = 0; act < MAX_ACTION_WIDTH; act++) {
            action += list[c].action[act];
        }
        console.log(`C${c.toString().padStart(2, '0')} ${condition} : ${action} Strength ${list[c].strength}`);
    }
}

function printWorld() {
    let y, x;
    console.log("World:");
    for (y = 0; y < MAX_WORLD_Y; y++) {
        process.stdout.write("\t");
        for (x = 0; x < MAX_WORLD_X; x++) {
            process.stdout.write(`${world[y][x]} `);
        }
        console.log();
    }
}


const detectors = [];
let c;


async  function  main() {
    let t, i;
     initWorld();
    initAgent();
    for (t = 0; t < 100; t++) {
         readDetectors(detectors);
        c =  matchClassifiers(detectors);
         sendEffectors(c);
        await sleep(1000);
        //console.clear();
        printWorld();
        /* If we've completed an episode */
        if ((t % MAX_EPISODE) === 0) {
            /* Tax the last classifier */
            list[c].strength -= list[c].bid;
            if (list[c].strength < 0.0) {
                list[c].strength = 0.0;
            }
            /* Reward classifiers that supported the episode */
            for (i = 0; i < MAX_CLASSIFIERS; i++) {
                if ((list[i].episode) && (i !== c)) {
                    list[i].strength += (list[c].bid / MAX_EPISODE);
                    list[i].episode = 0;
                }
            }
        }


    }
    printAgent();
    return 0;
}

main();

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}