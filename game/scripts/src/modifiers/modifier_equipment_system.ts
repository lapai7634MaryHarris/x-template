import { BaseModifier, registerModifier } from "../utils/dota_ts_adapter";

/** @luaTable */
declare const _G: any;

@registerModifier()
export class modifier_equipment_system extends BaseModifier {
    private stats = {
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
    };

    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    RemoveOnDeath(): boolean {
        return false;
    }

    OnCreated(params: any): void {
        print("[modifier_equipment_system] ✓ Modifier created");
        
        if (IsServer()) {
            const playerId = params. playerId;
            const globalStats = _G. EquipmentStats?.[playerId];
            
            if (globalStats) {
                this.stats = {
                    strength: globalStats.strength || 0,
                    agility: globalStats.agility || 0,
                    intelligence: globalStats.intelligence || 0,
                    armor: globalStats. armor || 0,
                    health: globalStats.health || 0,
                    mana: globalStats.mana || 0,
                    attack_damage: globalStats.attack_damage || 0,
                    attack_speed: globalStats. attack_speed || 0,
                    move_speed: globalStats.move_speed || 0,
                    magic_resistance: globalStats.magic_resistance || 0,
                };
                
                print(`[modifier_equipment_system] 接收装备属性:`);
                print(`  攻击速度: +${this.stats. attack_speed}`);
                
                // ⭐ 关键：用 SetStackCount 同步攻击速度到客户端
                this.SetStackCount(this.stats. attack_speed);
                
                const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
                if (parent && parent.IsHero()) {
                    parent.CalculateStatBonus(true);
                }
            }
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction. STATS_STRENGTH_BONUS,
            ModifierFunction. STATS_AGILITY_BONUS,
            ModifierFunction. STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.MANA_BONUS,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.BASEATTACK_BONUSDAMAGE,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction. MAGICAL_RESISTANCE_BONUS,
        ];
    }

    GetModifierBonusStats_Strength(): number {
        return this. stats.strength || 0;
    }

    GetModifierBonusStats_Agility(): number {
        return this.stats.agility || 0;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.stats. intelligence || 0;
    }

    GetModifierPhysicalArmorBonus(): number {
        return 0;
    }

    GetModifierHealthBonus(): number {
        return this.stats. health || 0;
    }

    GetModifierManaBonus(): number {
        return this. stats.mana || 0;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.stats.attack_damage || 0;
    }

    GetModifierBaseAttack_BonusDamage(): number {
        return this.stats.attack_damage || 0;
    }

    // ⭐ 攻击速度 - 服务器用 stats，客户端用 GetStackCount
    GetModifierAttackSpeedBonus_Constant(): number {
        if (IsServer()) {
            return this.stats.attack_speed || 0;
        } else {
            // 客户端从 StackCount 读取
            return this.GetStackCount();
        }
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.stats.move_speed || 0;
    }

    GetModifierMagicalResistanceBonus(): number {
        return this.stats.magic_resistance || 0;
    }
}