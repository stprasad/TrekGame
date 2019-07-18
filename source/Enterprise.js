class Enterprise extends GameObject
{
    componentDamageProbabilities()
    {
        var probArray = [];

        for (var key in this.components)
        {
            console.log("" + this.components[key].componentDamageProbability);
            probArray.push(this.components[key].componentDamageProbability);
        }

        console.assert(probArray.length == Object.keys(this.components).length);
        return probArray;
    }

    constructor()
    {
        super(Enterprise);
        this.torpedoes = Enterprise.StartTorpedoes;
        this.shields = Enterprise.StartShields;

        this.freeEnergy = Enterprise.StartEnergy;

        this.components =   {
                                WarpEngines : new WarpEnginesComponent(), 
                                ShortRangeSensors: new ShortRangeSensorsComponent(),
                                LongRangeSensors: new LongRangeSensorsComponent(),
                                PhaserControl : new PhaserControlComponent(),
                                PhotonTubes : new PhotonTubesComponent(),
                                DamageControl : new DamageControlComponent(),
                                ShieldControl : new ShieldControlComponent(), 
                                LibraryComputer : new LibraryComputerComponent()
                            }

        this.hitNoShields = false;
        this.dockStarbase = null;
        this.sensorHistory = new SensorHistory();
    }

    // called on navigation
    autoRepairComponents()
    {
        for (var key in this.components)
        {
            let oldHealth = this.components[key].componentHealth;
            this.components[key].componentHealth += (randomInt(Enterprise.MinComponentRepairPerTurn, Enterprise.MaxComponentRepairPerTurn) / 100);
            this.components[key].componentHealth = Math.min(this.components[key].componentHealth, 1.0);

            if (this.components[key].componentHealth == 1.0 && oldHealth != 1.0)
            {
                gameOutputAppend("\n" + this.components[key].componentName + " fully repaired!");
            }
        }
    }

    repairRandomComponent()
    {
        var damagedComponents = [];

        for (var key in this.components)
        {
            if (this.components[key].componentHealth != 1.0)
            {
                damagedComponents.push(this.components[key]);
            }
        }

        console.log("Enterprise has " + damagedComponents.length + " damaged components");

        if (!damagedComponents.length)return;

        let componentToRepair = damagedComponents[randomInt(0, damagedComponents.length-1)];
        componentToRepair.componentHealth = 1.0;

        gameOutputAppend("\n"+componentToRepair.componentName + " has been fully repaired!");
    }

    undock(starbase)
    {
        this.dockStarbase = null;
    }

    dockWithStarbase(starbase)
    {
        console.log("dock with starbase");

        this.torpedoes = Enterprise.StartTorpedoes;
        this.freeEnergy = Enterprise.StartEnergy - this.shields;
        this.dockStarbase = starbase;

        gameOutputAppend("\nDocked with starbase.  Torpedoes and energy replenished.  The starbase's shields protect the Enterprise.");

        this.repairRandomComponent();
    }

    // is our total energy less than the minimum energy cost to get anywhere?
    isStranded()
    {
        return (this.freeEnergy + this.shields) < this.warpEnergyCost(1); // energy cost to travel one square.
    }

    isDestroyed()
    {
        return this.hitNoShields;
    }

    // suggested minimum shield level for the current battlefield, to survive at least one round of enemy fire
    suggestedMinShieldLevel(enemyList)
    {
        let possibleDamageSum = 0.0;

        for (var x in enemyList)
        {
            possibleDamageSum += enemyList[x].maxPhaserDamage();
        }

        return possibleDamageSum;
    }

    // is it possible for a single round of enemy fire to destroy the enterprise?
    isShieldLevelCritical(enemyList)
    {
        return !this.dockStarbase && (this.shields < this.suggestedMinShieldLevel(enemyList));
    }

    warpEnergyCost(numSectors)
    {
        return Enterprise.EnergyCostPerSector * numSectors;
    }
    
    // assumes that the input value has been previously checked for the appropriate range and available value
    setShieldLevel(newShields)
    {
        if ((newShields > this.freeEnergy + this.shields) || newShields < 0.0)
        {
            throw "Invalid value for shield level"; 
        }

        this.freeEnergy += this.shields - newShields;
        this.shields = newShields;

        gameOutputAppend("\nShields set to " + this.shields + ".  " + this.freeEnergy + " free energy remaining.");
    }

    toString()
    {
        return "<*>";
    }

    static maxInstancesGame()
    {
        return 1;
    }

    static maxInstancesQuadrant()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }

    conditionString(game)
    {
        if (game.currentQuadrant.countEntitiesOfType(Klingon))
        {
            return "RED";
        }

        if ((this.freeEnergy + this.shields) < .1 * Enterprise.StartEnergy)
        {
            return "YELLOW";
        }

        return "GREEN";
    }

    passthroughDamage(energy)
    {
        // we want to map (as a starting guess, pre balance) 500 energy to a total wipeout of a component
        let passthroughDamage = energy * randomFloat(.001, .002);

        // random component index
        let idx = randomWithProbabilities(this.componentDamageProbabilities());

        let component = this.components[Object.keys(this.components)[idx]];

        component.componentHealth -= Math.min(passthroughDamage, component.componentHealth);

        gameOutputAppend(component.componentName + " hit.  Now at " + Math.floor(component.componentHealth*100) + "% integrity" );
    }

    onPhaserHit(energy, game)
    {
        if (this.dockStarbase)
        {
            gameOutputAppend("The starbase shields protect you from the incoming phaser fire.");
            return;
        }

        let hitRatio = energy / this.shields;

        if (this.shields < energy)
        {
            this.hitNoShields = true;
            this.shields = 0.0;

            return;
        }

        if ((hitRatio > Enterprise.DamagePassthroughRatio) || Math.random() < Enterprise.RandomPassthroughRatio)
        {
            this.passthroughDamage(energy);
        }

        this.shields -= energy;
        gameOutputAppend("Shields at " + this.shields);
    }

    firePhasers(energy, game)
    {
        console.log("fire phasers");

        let targets = [];

        var x;
        for (x in Enterprise.PhaserTargets)
        {
            targets.push(...game.currentQuadrant.getEntitiesOfType(Enterprise.PhaserTargets[x]));
        }

        console.assert(energy <= this.freeEnergy);

        this.freeEnergy -= energy;

        let endstr = targets.length > 1 ? "s." : ".";
        gameOutputAppend("\nFiring phasers at " + targets.length + " target" + endstr);
        console.assert(targets.length > 0);
        let damagePerTarget = energy / targets.length;

        var x;
        for (x in targets)
        {
            console.log("target");
            let target = targets[x];
            let dist = this.distanceToObject(target);

            let damageAttenuated = damagePerTarget / dist;
            let damageFinal = Math.floor(randomFloat(2.0, 3.0) * damageAttenuated);

            target.onPhaserHit(damageFinal, game);
        }

        if (!game.currentQuadrantScanned)
        {
            gameOutputAppend("\nRun combat sensor scan to see enemy shield levels.");
        }
    }

    fireTorpedo(game, target)
    {
        if (this.freeEnergy >= Enterprise.TorpedoEnergyCost)
        {
            gameOutputAppend("\nFiring torpedoes towards subsector " + target.sectorString());
            let torpedoIntersection = game.currentQuadrant.intersectionTest(this.sectorX, this.sectorY, target.sectorX, target.sectorY, Infinity);
            this.torpedoes--;
            this.freeEnergy -= Enterprise.TorpedoEnergyCost;
            
            if (torpedoIntersection.intersects != null)
            {
               torpedoIntersection.intersects.onTorpedoHit(game);
            }
            else
            {
                gameOutputAppend("\nThe torpedo missed!");
            }
        }
        else
        {
            //not enough energy
            gameOutputAppend("\nNot enough energy to fire torpedoes!");
        }
    }

    lrsStringEntityType(galaxyMap, entityType)
    {
        let header = "   ";
        for (let x = this.quadrantX - 1; x <= this.quadrantX + 1; x++)
        {
            header += padStringToLength((""+(x+1)), 6);
        }

        let border = "-------------------";
        let rval = header + "\n   " + border + '\n';

        for (let y = this.quadrantY - 1; y <= this.quadrantY + 1; y++)
        {
            rval += " " + (y+1) + " |";
            for (let x = this.quadrantX - 1; x <= this.quadrantX + 1; x++)
            {
                let quadrant = galaxyMap.lookup(x, y);
                if (quadrant)
                {
                    let k = quadrant.countEntitiesOfType(entityType);

                    if (x == this.quadrantX && y == this.quadrantY)
                    {
                        k = "" + k + "E";
                    }

                    rval += " " + padStringToLength(""+k, 3) + " |";
                }
                else
                {
                    rval += " *** |";
                }
            }
            rval += "\n   " + border + "\n";
        }
        return rval;
    }

    // long range scan
    lrsString(galaxyMap)
    {
        let rval = "\t KLINGONS\t\t  STARS\t\t\tSTARBASES\n";

        let klingonLRS = this.lrsStringEntityType(galaxyMap, Klingon);
        let starLRS = this.lrsStringEntityType(galaxyMap, Star);
        let starbaseLRS = this.lrsStringEntityType(galaxyMap, StarBase);

        let klingonLRSLines = klingonLRS.split('\n');
        let starLRSLines = starLRS.split('\n');
        let starbaseLRSLines = starbaseLRS.split('\n');

        console.assert(klingonLRSLines.length == starLRSLines.length);
        for (var x in klingonLRSLines)
        {
            rval += klingonLRSLines[x] + "\t" + starLRSLines[x] + "\t" + starbaseLRSLines[x] + '\n';
        }

        return rval;
    }

    warp(sectorXEnd, sectorYEnd, sectorsToTravel, game)
    {
        let energyRequired = this.warpEnergyCost(sectorsToTravel);

        if (this.freeEnergy < energyRequired)
        {
            gameOutputAppend("\nNot enough energy free to complete maneuver!");
            return false;
        }

        let intersection = game.currentQuadrant.intersectionTest(this.sectorX, this.sectorY, sectorXEnd, sectorYEnd)
           
        this.sectorX = Math.floor(intersection.lastX);
        this.sectorY = Math.floor(intersection.lastY);

        if (intersection.intersects != null)
        {
            gameOutputAppend("\nObstruction ahead.  Shutting down warp engines.");
        }

        if (!intersection.stepIterations)
        {
            return false;
        }

        let actualEnergy = this.warpEnergyCost(intersection.stepIterations);

        // get the energy cost of the sectors we actually travelled
        this.freeEnergy -= actualEnergy;

        return true;
    }

    damageReport()
    {
        gameOutputAppend("\nDAMAGE REPORT:\n");
        gameOutputAppend("Component Integrity:")
        for (var key in this.components)
        {
            let component = this.components[key];
            gameOutputAppend("" + component.componentName + " : " + Math.round(component.componentHealth * 100) + "%");
        }

        gameOutputAppend("\n\nNOTES:\nRepair crews can repair 1-5% damage per stardate.  A starbase will fully repair a single component every stardate.");

        for (var key in this.components)
        {
            let component = this.components[key];
            component.damageReport();
        }
    }
}

Enterprise.StartTorpedoes = 10;
Enterprise.StartEnergy = 3000;
Enterprise.StartShields = 0;
Enterprise.TorpedoEnergyCost = 10;
Enterprise.EnemyScanCost = 10;
Enterprise.PhaserTargets = [Klingon];       // future extension : this list could be dynamic based on evolving gameplay alliances, etc :) 
Enterprise.EnergyCostPerSector = 1.0;       // Warp cost per sector moved
Enterprise.EnergyCostPerQuadrant = 10.0;       // Warp cost per quadrant moved
Enterprise.DamagePassthroughRatio = .25;    // if damage is 25% of shields or more, pass damage through to components
Enterprise.RandomPassthroughRatio = .25;    // 25% chance that damage will pass through to ship components regardless of shields
Enterprise.MinComponentRepairPerTurn = 1;  // integrity min autorepair per component
Enterprise.MaxComponentRepairPerTurn = 5;  // integrity max autorepair per component
