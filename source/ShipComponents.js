class ShipComponent
{
    constructor (componentName, damProb)
    {
        this.componentHealth = 1.0; //percent
        this.componentName = componentName;
        this.componentDamageProbability = damProb;
    }

    damageReport()
    {
    }

    passthroughDamage(enterprise, damage)
    {
        this.componentHealth -= Math.min(damage, this.componentHealth);
    }
}

// cap speed.
class WarpEnginesComponent extends ShipComponent
{
    constructor()
    {
        super("Warp Engines", .0625);
    }

    fullyFunctional()
    {
        return this.componentHealth >= WarpEnginesComponent.FullyFunctionalHealth;
    }

    damageReport()
    {
        gameOutputAppend("At its current level of repair, the warp engines can achieve a speed of " + Math.round(this.maxSpeed()) + " sectors per stardate");
    }

    maxSpeed()
    {
        let t = Math.min(1.0, this.componentHealth / WarpEnginesComponent.FullyFunctionalHealth);
        return (1.0 - t) * WarpEnginesComponent.MinSpeed + t * WarpEnginesComponent.MaxSpeed;
    }
}

WarpEnginesComponent.FullyFunctionalHealth = .8;

// min sectors to travel in a single stardate jump.  Cover at least sqrt(2) so we can go one sector in any direction even diagonal
WarpEnginesComponent.MinSpeed = 1.5;

// max sectors to travel in a single stardate jump.  sqrt 2 for diagonal (pythagorean)
WarpEnginesComponent.MaxSpeed = Math.sqrt(2.0) * Math.max(mapWidthSectors, mapHeightSectors);


class ShortRangeSensorsComponent extends ShipComponent
{
    constructor()
    {
        super("Short Range Sensors", .0625);
        this.generateCorruptGrid();
    }

    fullyFunctional()
    {
        return this.componentHealth > ShortRangeSensorsComponent.FullyFunctionalHealth;
    }

    chanceCorrupt()
    {
        // goes from 0 when the component is at the maximum health in range, to 1 when the component is at 0%
        let hnorm = (ShortRangeSensorsComponent.FullyFunctionalHealth - this.componentHealth) / ShortRangeSensorsComponent.FullyFunctionalHealth;

        // lerp
        let chanceCorrupt = (1.0 - hnorm) * ShortRangeSensorsComponent.MinChanceCorrupt + hnorm * ShortRangeSensorsComponent.MaxChanceCorrupt;

        return chanceCorrupt;
    }

    damageReport()
    {
        if (!this.fullyFunctional())
        {
            gameOutputAppend("Short range sensors are damaged.  Map display may be corrupted.");
        }
    }

    generateCorruptGrid()
    {
        this.corruptGrid = new Grid(sectorWidthSubsectors, sectorHeightSubsectors);

        let corruptChance = this.chanceCorrupt();

        for (var x in this.corruptGrid.contents)
        {
            this.corruptGrid.setValue1D(x, Math.random() < corruptChance);
        }
    }

    isSubsectorCorrupt1D(x)
    {
        return this.corruptGrid.lookup1D(x);
    }

    isSubsectorCorrupt(x, y)
    {
        return this.corruptGrid.lookup(x,y);
    }
}

ShortRangeSensorsComponent.FullyFunctionalHealth = .7;   // short range scan fully functional above this health
ShortRangeSensorsComponent.MinChanceCorrupt = .1;        // For a particular subsector on the map, minimum chance it'll be corrupt when integrity is high
ShortRangeSensorsComponent.MaxChanceCorrupt = .75;       // For a particular subsector on the map, maximum chance it'll be corrupt when integrity is low


class LongRangeSensorsComponent extends ShipComponent
{
    constructor()
    {
        super ("Long Range Sensors", .25);
    }

    functional()
    {
        return this.componentHealth >= LongRangeSensorsComponent.FullyFunctionalHealth;
    }

    damageReport()
    {
        if (!this.functional())
        {
            gameOutputAppend("Long range sensors disabled.");
        }
    }
}

LongRangeSensorsComponent.FullyFunctionalHealth = .8;


class PhaserControlComponent extends ShipComponent
{
    constructor()
    {
        super ("Phaser Control", .0625);
    }

    canFire()
    {
        return this.componentHealth >= PhaserControlComponent.DisabledThreshold;
    }

    phaserAccuracy()
    {
        let t = Math.min(this.componentHealth / PhaserControlComponent.FullyFunctionalHealth, 1.0);
        return (1.0 - t) * PhaserControlComponent.MinAccuracy + t; //lerp
    }

    isHit()
    {
        return Math.random() <= this.phaserAccuracy();
    }

    damageReport()
    {
        gameOutputAppend("Phasers Operable : " + (this.canFire() ? "YES" : "NO"));
        gameOutputAppend("Phaser Accuracy : " + (100*this.phaserAccuracy()) + "%");
    }
}

PhaserControlComponent.DisabledThreshold = .5;
PhaserControlComponent.FullyFunctionalHealth = .75;
PhaserControlComponent.MinAccuracy = .5;


class PhotonTubesComponent extends ShipComponent
{
    constructor()
    {
        super ("Photon Tubes", .125);
    }

    canFire()
    {
        return this.componentHealth > PhotonTubesComponent.DisabledThreshold;
    }

    targetingAvailable()
    {
        return this.componentHealth > PhotonTubesComponent.DamagedThreshold;
    }

    damageReport()
    {
        if (this.canFire())
        {
            if (!this.targetingAvailable())
            {
               gameOutputAppend("Due to damage, torpedo targeting computer is nonfunctional.  You will need to input torpedo trajectories manually until the system is repaired.");
            }

            gameOutputAppend("Torpedo Accuracy : " + (100 * this.torpedoAccuracy()) + "%");
        }
        else
        {
            gameOutputAppend("Torpedo tubes too damaged to fire.");
        }
    }

    torpedoAccuracy()
    {
        let t = (this.componentHealth - PhotonTubesComponent.DisabledThreshold) / (PhotonTubesComponent.DamagedThreshold - PhotonTubesComponent.DisabledThreshold);
        t = Math.min(t, 1.0);
        return (1.0 - t) * PhotonTubesComponent.MinAccuracy + t;
    }

    isHit()
    {
        return Math.random() <= this.torpedoAccuracy();
    }
}

PhotonTubesComponent.MinAccuracy = .25;         // 25% chance to hit minimum for torpedoes
PhotonTubesComponent.DamagedThreshold = .5;     // 50% health = automatic targeting is down.
PhotonTubesComponent.DisabledThreshold = .25;   // 25% health = can't fire torpedoes.

// make the shield scan thing conditional.  in both places.
class ShieldControlComponent extends ShipComponent
{
    constructor()
    {
        super ("Shield Control", .125);
    }

    maxShields()
    {
        let t = Math.min(1.0, this.componentHealth / ShieldControlComponent.FullyFunctionalHealth);

        return Math.round((1.0 - t) * ShieldControlComponent.MinShields + (t * ShieldControlComponent.MaxShields));
    }

    passthroughDamage(enterprise, damage)
    {
        this.componentHealth -= Math.min(damage, this.componentHealth);

        if (enterprise.shields > this.maxShields())
        {
            enterprise.shields = this.maxShields();
            gameOutputAppend("Deflector shields hit!  Shield energy dropped to " + this.maxShields());
        }
    }

    damageReport()
    {
        gameOutputAppend("Deflector shield system can process " + this.maxShields() + " units of energy out of a possible " + ShieldControlComponent.MaxShields);
    }

    estimateAvailable()
    {
        return this.componentHealth >= ShieldControlComponent.ShowShieldEstimateHealth;
    }
}

ShieldControlComponent.MinShields = 0;
ShieldControlComponent.MaxShields = 2000; ///\todo calculate what kind of combat situations would minimally exceed this and prevent them in the generator
ShieldControlComponent.FullyFunctionalHealth = .8;
ShieldControlComponent.ShowShieldEstimateHealth = .6;

class LibraryComputerComponent extends ShipComponent
{
    constructor()
    {
        super ("Library Computer", .3125);
    }

    mapsAccessible()
    {
        return this.componentHealth > LibraryComputerComponent.MapsThreshold;
    }

    damageReportAvailable()
    {
        return this.componentHealth > LibraryComputerComponent.DamageReportThreshold;
    }

    damageReport()
    {
        if (!this.mapsAccessible())
        {
            gameOutputAppend("Ship computer is too damaged to access maps.");
        }
    }
}

LibraryComputerComponent.MapsThreshold = .25; // 25% health = can't access maps.
LibraryComputerComponent.DamageReportThreshold = .5; // 50% health = can't access damage report