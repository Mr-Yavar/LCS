const fs = require('fs')

let population = {};
let dataSet = fs.readFileSync('sample.txt', 'utf8').split('\n');
let numberOfData = 32;
let sizeOfPopulation = 1000;
//===================Learning Part
let cycles = 1000;
let intialCycle =300;
let indexes = [];



const ErrorsFile = 'Errors.txt';
const CorrectsFile = 'Corrects.txt';
const MatchsFile = 'Matchs.txt';
let Errors = [];
let Corrects = [];
let Matchs = [];
while (cycles >= 1) {
    let rand ;
    if(indexes.length>=numberOfData){
       // rand= indexes[(intialCycle - (cycles))%(numberOfData-1)];
       indexes = [];
    }
        do{
            rand = Math.floor(Math.random() * numberOfData);

        }while(indexes.includes(rand));
        indexes.push(rand);




    let state = dataSet[rand].replace('\r', '').split('\t');

    let MatchSet = [];
    let CorrectSet = [];
    let InCorrectSet = [];
    let condition = state.slice(0, state.length - 1);
    let action = state.slice(-1)[0];


    //===========================Matching Engine
    for (let index in population) {
        let CurrentRule = population[index].condition;
        if (EvaluateRule(condition, CurrentRule)) {
            MatchSet.push(index);
        }
    }
    //===========================END Matching Engine
    //===========================Dividing Engine
    for (let index of MatchSet) {
        population[index].Match++;
        if (action === population[index].action) {
            CorrectSet.push(population[index])
            population[index].Correct++;
        } else {
            InCorrectSet.push(population[index]);
            population[index].InCorrect++;

        }
        population[index].fitness = (Math.pow(population[index].Correct / population[index].Match,2)).toFixed(2);
        population[index].accuracy = Math.pow(population[index].fitness, 2);
    }

    Errors.push(InCorrectSet.length);

    //===========================END Dividing Engine
    //===========================Covering Engine
    if (MatchSet.length === 0 || CorrectSet.length === 0 || Object.keys(population).length === 0) {
        let item = Covering(condition, action);
        population[item.condition.join(',')] = item;

       Corrects.push(1);
        Matchs.push(1);
    }else{
        Corrects.push(CorrectSet.length);
        Matchs.push(MatchSet.length);
    }
    //===========================END Covering Engine



    for (let i in CorrectSet) {
        // Iterate over the remaining classifiers.
        for (let j in CorrectSet) {
            // If the current classifier subsumes the next classifier, remove the next classifier.
            if (CorrectSet[i].condition === CorrectSet[j].condition)
                continue;

            if(CorrectSet[i].fitness < 0.99)
                continue;

            if ( EvaluateRule(CorrectSet[j].condition, CorrectSet[i].condition)) {
                population[CorrectSet[i].condition].numerosity+=population[CorrectSet[j].condition].numerosity;
                delete population[CorrectSet[j].condition];
                delete CorrectSet[j];
            }
        }
    }
    CorrectSet = CorrectSet.filter((element) => {
        return element !== undefined;
    });
    if (CorrectSet.length >= 2) {
        let max = 0;
        let max1 = 0;
        let index1 = CorrectSet[0].condition;
        let index2 = CorrectSet[0].condition;
        for (let item of CorrectSet) {
            if (item.fitness*item.numerosity >= max) {
                max1 = max;
                max = item.fitness*item.numerosity;
                index2 = index1;
                index1 = item.condition;
            }
        }
        if(population[index1]!=undefined && population[index2]!=undefined) {
            let newCond = crossover(population[index1].condition, population[index2].condition);
            let newRule = new Rule(newCond, population[index1].action, 0);
            newRule.fitness=0;
            newRule.Match=0;
            newRule.Correct=0;
            population[newCond.join(',')] = newRule;
            newCond = crossover(population[index2].condition, population[index1].condition);
            newRule = new Rule(newCond, population[index1].action, 0);
            newRule.fitness=0;
            newRule.Match=0;
            newRule.Correct=0;
            population[newCond.join(',')] = newRule;
        }
    }


    Deletion(population, sizeOfPopulation);
    cycles--;
}
//===================END Learning Part
console.log('------------------------ Learning Was Compelted ------------------------');
//Compaction();

fs.writeFile(ErrorsFile, Errors.join('\n'), err => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Wrote ${Errors.length} lines to ${ErrorsFile}`);
});
fs.writeFile(CorrectsFile, Corrects.join('\n'), err => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Wrote ${Corrects.length} lines to ${CorrectsFile}`);
});
fs.writeFile(MatchsFile, Matchs.join('\n'), err => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Wrote ${Matchs.length} lines to ${MatchsFile}`);
});
function Covering(condition, act) {
    let newCond = condition;

    let count = condition.length;
let hashCount=0;



    for (let i = 0; i < condition.length; i++) {
        if (Math.random() > 0.8) {
            newCond[i] = "#";
            hashCount++;
        }

   }

    return new Rule(newCond, act, condition.length - hashCount);
}


function Rule(cond, action, spic) {
    this.condition = [...cond];
    this.action = action;
    this.fitness = 1;
    this.accuracy = 0;
    this.Correct = 1;
    this.InCorrect = 0;
    this.Match = 1;
    this.specificity = spic;
    this.numerosity = 1;
    return this;

}

function EvaluateRule(state, rule) {
    for (let key in rule)
        if (state[key] != rule[key] && rule[key] != '#')
            return false;
    return true;
}

//==================GA section
function crossover(parent1, parent2) {
    // Create a new individual by crossing over the two parents.
    let child = [];
    let half = Math.floor(parent1.length / 2);
    child = [...parent1];
    for (let i = half; i < parent2.length; i++) {
        child[i]=parent2[i];
    }

    return child;
}

function mutate(individual) {
    // Mutate the individual by randomly changing one of its genes.
    var geneIndex = Math.floor(Math.random() * individual.length);
    individual[geneIndex] = "#";
    return individual;
}
//==================End GA section

//COMPACTION
function Compaction(){
    for(let index in population){
        if(population[index].Match==1)
            delete population[index];
    }
}


// SAVING RULES
fs.writeFile('rules.json', JSON.stringify(population), (err) => {
    if (err) throw err;
    else {
        console.log("[P] was saved in rules.json");
    }
});


dataSet = fs.readFileSync('TstData.txt', 'utf8').split('\n');

let correct = 0;
let test = 0;
for (let i = 0; i < 32; i++) {
    test++;
    let rand = Math.floor(Math.random() * 1000);
    let state = dataSet[i].replace('\r', '').split('\t');


    let condition = state.slice(0, state.length - 1);
    let action = state.slice(-1)[0];
    console.log('\n--------------------------------------------------------------------------------------');
    console.log('Current instance from dataset: ['+condition.join(',')+'] \t action:'+action);
    console.log('Matching : ');
    let votes = {0: 0, 1: 0};
    for (let index in population) {
        let CurrentRule = population[index].condition;

        if (EvaluateRule(condition, CurrentRule)) {
            console.log(' ['+population[index].condition.join(',')+'] \t action:'+population[index].action+'\t Num : '+population[index].numerosity+'\t fitness: '+population[index].fitness);
            votes[population[index].action]+=population[index].numerosity*population[index].fitness;
        }
    }

    if(votes[0]>votes[1]){
        if(action==0)
            correct++;
        console.log("Prediction : 0");
    }else if(votes[0]<votes[1]){
        if(action==1)
            correct++;
        console.log("Prediction : 1");
    }else{
        console.log("Prediction : None");
    }



}
console.log(test, ' correct :', correct, '-> accuracy :', correct / test);

// Fine-tune rule selection criteria
function Deletion(population, maxPopulationSize) {
    let totalFitness = 0;
    let worstFitness = Infinity;
    let worstRule;
    let size = 0;
    // Calculate total fitness and find the rule with the lowest fitness
    for (let index in population) {
        let currentRule = population[index];
        totalFitness += currentRule.fitness;
        if (currentRule.fitness < worstFitness) {
            worstFitness = currentRule.fitness;
            worstRule = index;
        }
        size += population[index].numerosity;
    }

    // Remove worst rule if population size exceeds maximum
    if (size > maxPopulationSize) {

        if (population[worstRule].numerosity == 1) {
            delete population[worstRule];
        } else {
            population[worstRule].numerosity--;
        }
    }

}
