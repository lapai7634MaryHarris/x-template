export class RageSystem {
    private static heroRageMap = new Map<EntityIndex, number>();
    private static readonly MAX_RAGE = 100;
    private static readonly RAGE_PER_ATTACK = 5;
    
    // 注册需要怒气的技能
    private static rageAbilities = new Map<string, number>();
    
    static Init() {
        print("[RageSystem] Initializing...");
        
        // 注册需要怒气的技能
        this.RegisterRageAbility("axe_giant_strike", 20);
        this.RegisterRageAbility("warrior_execute", 25);  
        ListenToGameEvent("npc_spawned", (event) => {
            const spawnedUnit = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;
            if (spawnedUnit && spawnedUnit.IsRealHero()) {
                this.InitHeroRage(spawnedUnit as CDOTA_BaseNPC_Hero);
            }
        }, null);
        
        print("[RageSystem] Initialized!");
    }
    
    static RegisterRageAbility(abilityName: string, rageCost: number) {
        this.rageAbilities.set(abilityName, rageCost);
        print(`[RageSystem] Registered ability: ${abilityName} (cost: ${rageCost} rage)`);
    }
    
    static CanCastAbility(hero: CDOTA_BaseNPC_Hero, abilityName: string): boolean {
        const rageCost = this.rageAbilities.get(abilityName);
        if (rageCost === undefined) {
            return true;
        }
        
        const currentRage = this.GetRage(hero);
        return currentRage >= rageCost;
    }
    
    static TryConsumeAbilityRage(hero: CDOTA_BaseNPC_Hero, abilityName: string): boolean {
        const rageCost = this.rageAbilities.get(abilityName);
        if (rageCost === undefined) {
            return true;
        }
        
        const currentRage = this.GetRage(hero);
        if (currentRage >= rageCost) {
            this.SetRage(hero, currentRage - rageCost);
            print(`[RageSystem] ${hero.GetUnitName()} consumed ${rageCost} rage for ${abilityName}`);
            return true;
        }
        
        print(`[RageSystem] ${hero.GetUnitName()} cannot cast ${abilityName}: insufficient rage (${currentRage}/${rageCost})`);
        this.ShowInsufficientRageWarning(hero);
        return false;
    }
    
    static InitHeroRage(hero: CDOTA_BaseNPC_Hero) {
        const heroIndex = hero.GetEntityIndex();
        const heroName = hero.GetUnitName();
        
        if (heroName === "npc_dota_hero_axe") {
            this.heroRageMap.set(heroIndex, 0);
            
            hero.AddNewModifier(hero, undefined, "modifier_rage_attack_listener", {});
            
            // 🔧 为所有注册的怒气技能添加检查器（使用 hero.AddNewModifier）
            this.rageAbilities.forEach((rageCost, abilityName) => {
                const ability = hero.FindAbilityByName(abilityName);
                if (ability) {
                    hero.AddNewModifier(hero, ability, "modifier_rage_ability_checker", {});
                    print(`[RageSystem] Added checker for ${abilityName}`);
                }
            });
            
            this.UpdateRageUI(hero);
            
            print(`[RageSystem] Initialized rage system for ${heroName}`);
        }
    }
    
    static OnHeroAttack(hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC) {
        print(`[RageSystem] OnHeroAttack called for ${hero.GetUnitName()}`);
        this.AddRage(hero, this.RAGE_PER_ATTACK);
    }
    
    static AddRage(hero: CDOTA_BaseNPC_Hero, amount: number) {
        const currentRage = this.GetRage(hero);
        const newRage = Math.min(currentRage + amount, this.MAX_RAGE);
        this.SetRage(hero, newRage);
    }
    
    static SetRage(hero: CDOTA_BaseNPC_Hero, amount: number) {
        const heroIndex = hero.GetEntityIndex();
        const clampedAmount = Math.max(0, Math.min(amount, this.MAX_RAGE));
        
        this.heroRageMap.set(heroIndex, clampedAmount);
        this.UpdateRageUI(hero);
        
        print(`[RageSystem] ${hero.GetUnitName()} rage set to ${clampedAmount}`);
    }
    
    static GetRage(hero: CDOTA_BaseNPC_Hero): number {
        const heroIndex = hero.GetEntityIndex();
        return this.heroRageMap.get(heroIndex) || 0;
    }
    
    static ConsumeRage(hero: CDOTA_BaseNPC_Hero, amount: number): boolean {
        const currentRage = this.GetRage(hero);
        
        if (currentRage >= amount) {
            this.SetRage(hero, currentRage - amount);
            print(`[RageSystem] ${hero.GetUnitName()} consumed ${amount} rage`);
            return true;
        }
        
        this.ShowInsufficientRageWarning(hero);
        return false;
    }
    
    static HasEnoughRage(hero: CDOTA_BaseNPC_Hero, amount: number): boolean {
        return this.GetRage(hero) >= amount;
    }
    
    private static ShowInsufficientRageWarning(hero: CDOTA_BaseNPC_Hero) {
        const playerID = hero.GetPlayerOwnerID();
        if (playerID !== -1) {
            hero.EmitSound("General.CastFail_InvalidTarget_Hero");
        }
    }
    
    private static UpdateRageUI(hero: CDOTA_BaseNPC_Hero) {
        const playerID = hero.GetPlayerOwnerID();
        if (playerID === -1) return;
        
        const currentRage = this.GetRage(hero);
        
        print(`[RageSystem] Sending UI update: ${currentRage}/${this.MAX_RAGE}`);
        
        (CustomGameEventManager.Send_ServerToPlayer as any)(
            PlayerResource.GetPlayer(playerID)!,
            "rage_updated",
            {
                current: currentRage,
                max: this.MAX_RAGE
            }
        );
    }
}