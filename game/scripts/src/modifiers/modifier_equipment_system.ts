import { BaseModifier, registerModifier } from "../utils/dota_ts_adapter";

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

    // ⭐ 在创建时接收参数
    OnCreated(params: any): void {
        if (!IsServer()) return;
        
        print("[modifier_equipment_system] ✓ Modifier created");
        
        // ⭐ 如果传递了参数，使用参数初始化 stats
        if (params && typeof params === 'object') {
            this.stats = {
                strength: params.strength || 0,
                agility: params. agility || 0,
                intelligence: params.intelligence || 0,
                armor: params.armor || 0,
                health: params.health || 0,
                mana: params. mana || 0,
                attack_damage: params.attack_damage || 0,
                attack_speed: params.attack_speed || 0,
                move_speed: params.move_speed || 0,
                magic_resistance: params.magic_resistance || 0,
            };
            
            print(`[modifier_equipment_system] 接收装备属性:`);
            print(`  力量: +${this.stats.strength}`);
            print(`  敏捷: +${this.stats.agility}`);
            print(`  智力: +${this.stats.intelligence}`);
            print(`  攻击力: +${this. stats.attack_damage}`);
            
            const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
            if (parent && parent.IsHero()) {
                parent. CalculateStatBonus(true);
            }
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction. STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.MANA_BONUS,
            ModifierFunction. PREATTACK_BONUS_DAMAGE,
            ModifierFunction.BASEATTACK_BONUSDAMAGE,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction. MOVESPEED_BONUS_CONSTANT,
            ModifierFunction. MAGICAL_RESISTANCE_BONUS,
             ModifierFunction.ATTACKSPEED_BASE_OVERRIDE,  // ⭐ 添加这个
             
        ];
    }

    // 力量加成
    GetModifierBonusStats_Strength(): number {
        return this.stats.strength || 0;
    }

    // 敏捷加成
    GetModifierBonusStats_Agility(): number {
        return this.stats.agility || 0;
    }

    // 智力加成
    GetModifierBonusStats_Intellect(): number {
        return this.stats.intelligence || 0;
    }

    // 护甲加成（虽然通过 SetPhysicalArmorBaseValue 设置，这里保留以防万一）
    GetModifierPhysicalArmorBonus(): number {
        return 0;  // 护甲已在 equipment_vault_system 中直接设置
    }

    // 生命加成
    GetModifierHealthBonus(): number {
        return this.stats.health || 0;
    }

    // 魔法加成
    GetModifierManaBonus(): number {
        return this.stats.mana || 0;
    }
GetModifierAttackSpeedBaseOverride(): number {
    return this.stats.attack_speed || 0;
}
    // 攻击力加成（方法1）
    GetModifierPreAttack_BonusDamage(): number {
        return this.stats.attack_damage || 0;
    }

    // 攻击力加成（方法2，确保生效）
    GetModifierBaseAttack_BonusDamage(): number {
        return this.stats.attack_damage || 0;
    }

    // 攻击速度加成
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.stats.attack_speed || 0;
    }

    // 移动速度加成
    GetModifierMoveSpeedBonus_Constant(): number {
        return this. stats.move_speed || 0;
    }

    // 魔法抗性加成
    GetModifierMagicalResistanceBonus(): number {
        return this.stats.magic_resistance || 0;
    }
}