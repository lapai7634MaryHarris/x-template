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
        print("[modifier_equipment_system] Modifier created");
        
        if (IsServer()) {
            // 从 parent 获取 playerId
            const parent = this.GetParent();
            if (! parent) {
                print("[modifier_equipment_system] 无法获取 Parent");
                return;
            }
            
            const playerId = parent.GetPlayerOwnerID();
            if (playerId === -1) {
                print("[modifier_equipment_system] 无法获取 PlayerID");
                return;
            }
            
            // 从全局表读取属性
            const globalStats = _G. EquipmentStats ?  _G.EquipmentStats[playerId] : null;
            
            if (globalStats) {
                this. stats = {
                    strength: globalStats. strength || 0,
                    agility: globalStats.agility || 0,
                    intelligence: globalStats.intelligence || 0,
                    armor: globalStats.armor || 0,
                    health: globalStats.health || 0,
                    mana: globalStats.mana || 0,
                    attack_damage: globalStats.attack_damage || 0,
                    attack_speed: globalStats.attack_speed || 0,
                    move_speed: globalStats.move_speed || 0,
                    magic_resistance: globalStats.magic_resistance || 0,
                };
                
                print("[modifier_equipment_system] 属性已加载:");
                print("  力量: +" + this.stats.strength);
                print("  敏捷: +" + this.stats.agility);
                print("  攻击力: +" + this.stats. attack_damage);
                print("  攻击速度: +" + this. stats.attack_speed);
                
                this.SetStackCount(this.stats.attack_speed);
                
                const hero = parent as CDOTA_BaseNPC_Hero;
                if (hero && hero.IsHero()) {
                    hero. CalculateStatBonus(true);
                }
            } else {
                print("[modifier_equipment_system] 玩家 " + playerId + " 没有装备属性数据");
            }
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.MANA_BONUS,
            ModifierFunction. PREATTACK_BONUS_DAMAGE,
            ModifierFunction. BASEATTACK_BONUSDAMAGE,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction. MOVESPEED_BONUS_CONSTANT,
            ModifierFunction. MAGICAL_RESISTANCE_BONUS,
        ];
    }

    GetModifierBonusStats_Strength(): number {
        return this.stats.strength || 0;
    }

    GetModifierBonusStats_Agility(): number {
        return this.stats.agility || 0;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.stats.intelligence || 0;
    }

    GetModifierHealthBonus(): number {
        return this.stats.health || 0;
    }

    GetModifierManaBonus(): number {
        return this.stats.mana || 0;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.stats.attack_damage || 0;
    }

    GetModifierBaseAttack_BonusDamage(): number {
        return this.stats.attack_damage || 0;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        if (IsServer()) {
            return this.stats.attack_speed || 0;
        } else {
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