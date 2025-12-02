import { BaseModifier, registerModifier } from "../utils/dota_ts_adapter";

/** @luaTable */
declare const _G: {
    EquipmentStats: { [playerId: number]: EquipmentTotalStats };
};

@registerModifier()
export class modifier_equipment_system extends BaseModifier {
    private stats: EquipmentTotalStats = {
        strength: 0,
        agility: 0,
        intelligence: 0,
        armor: 0,
        health: 0,
        mana: 0,
        attack_damage: 0,
        attack_speed: 0,
        move_speed: 0,
        magic_resistance: 0,
        crit_chance: 0,
        crit_multiplier: 0,
        cooldown_reduction: 0,
        fire_resistance: 0,
        cold_resistance: 0,
        lightning_resistance: 0,
        evasion: 0,
    };

    IsHidden(): boolean { return true; }
    IsPurgable(): boolean { return false; }
    RemoveOnDeath(): boolean { return false; }

    OnCreated(params: any): void {
        if (!IsServer()) return;
        this.StartIntervalThink(0.1);
        this.LoadStatsFromGlobal();
    }

    OnRefresh(params: any): void {
        if (!IsServer()) return;
        this.LoadStatsFromGlobal();
    }

    OnIntervalThink(): void {
        if (!IsServer()) return;
        this.LoadStatsFromGlobal();
    }

    private LoadStatsFromGlobal(): void {
        const parent = this.GetParent();
        if (! parent || parent.IsNull()) return;
        
        const playerId = parent.GetPlayerOwnerID();
        if (playerId === -1) return;
        
        const globalStats = _G.EquipmentStats ?  _G.EquipmentStats[playerId] : null;
        
        if (globalStats) {
            this.stats = {
                strength: globalStats.strength || 0,
                agility: globalStats.agility || 0,
                intelligence: globalStats.intelligence || 0,
                armor: globalStats.armor || 0,
                health: globalStats.health || 0,
                mana: globalStats.mana || 0,
                attack_damage: globalStats.attack_damage || 0,
                attack_speed: globalStats.attack_speed || 0,
                move_speed: globalStats.move_speed || 0,
                magic_resistance: globalStats.magic_resistance || 0,
                crit_chance: globalStats.crit_chance || 0,
                crit_multiplier: globalStats.crit_multiplier || 0,
                cooldown_reduction: globalStats.cooldown_reduction || 0,
                fire_resistance: globalStats.fire_resistance || 0,
                cold_resistance: globalStats.cold_resistance || 0,
                lightning_resistance: globalStats.lightning_resistance || 0,
                evasion: globalStats.evasion || 0,
            };
            
            // 使用 StackCount 同步攻速到客户端
            this.SetStackCount(this.stats.attack_speed);
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.MANA_BONUS,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.BASEATTACK_BONUSDAMAGE,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.MAGICAL_RESISTANCE_BONUS,
            ModifierFunction.EVASION_CONSTANT,
        ];
    }

    GetModifierBonusStats_Strength(): number { return this.stats.strength || 0; }
    GetModifierBonusStats_Agility(): number { return this.stats.agility || 0; }
    GetModifierBonusStats_Intellect(): number { return this.stats.intelligence || 0; }
    GetModifierPhysicalArmorBonus(): number { return this.stats.armor || 0; }
    GetModifierHealthBonus(): number { return this.stats.health || 0; }
    GetModifierManaBonus(): number { return this.stats.mana || 0; }
    GetModifierPreAttack_BonusDamage(): number { return this.stats.attack_damage || 0; }
    GetModifierBaseAttack_BonusDamage(): number { return this.stats.attack_damage || 0; }
    
    GetModifierAttackSpeedBonus_Constant(): number {
        if (IsServer()) {
            return this.stats.attack_speed || 0;
        } else {
            return this.GetStackCount();
        }
    }
    
    GetModifierMoveSpeedBonus_Constant(): number { return this.stats.move_speed || 0; }
    GetModifierMagicalResistanceBonus(): number { return this.stats.magic_resistance || 0; }
    GetModifierEvasion_Constant(): number { return this.stats.evasion || 0; }
}