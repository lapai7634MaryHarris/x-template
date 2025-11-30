/**
 * 伤害计算器
 * 基于乘区系统计算最终伤害
 */

import {
    StatType,
    SkillTag,
    SkillConfig,
    SKILL_CONFIG,
    STAT_TO_MULTIPLIER,
    SKILL_TYPE_STAT_TO_TAG,
    MultiplierType,
    CRIT_CONFIG,
} from '../config/damage_config';

// ========== 玩家属性收集器 ==========
export interface PlayerStats {
    // 乘区2：增幅（加法叠加）
    increasedDamage: number;           // 通用增伤%
    increasedPhysicalDamage: number;   // 物理增伤%
    increasedElementalDamage: number;  // 元素增伤%
    increasedFireDamage: number;
    increasedColdDamage: number;
    increasedLightningDamage: number;
    
    // 乘区3：额外（每个独立乘算）
    moreDamage: number[];              // 通用额外伤害%数组
    morePhysicalDamage: number[];
    moreElementalDamage: number[];
    
    // 乘区4：暴击
    critChance: number;                // 总暴击率%
    critMultiplier: number;            // 总暴击伤害%
    
    // 乘区5：技能类型（加法叠加）
    projectileDamage: number;
    areaDamage: number;
    meleeDamage: number;
    spellDamage: number;
    attackDamage: number;
    dotDamage: number;
    
    // 其他
    cooldownReduction: number;
    areaOfEffect: number;
}

// 创建空白属性
export function createEmptyStats(): PlayerStats {
    return {
        increasedDamage: 0,
        increasedPhysicalDamage: 0,
        increasedElementalDamage: 0,
        increasedFireDamage: 0,
        increasedColdDamage: 0,
        increasedLightningDamage: 0,
        
        moreDamage: [],
        morePhysicalDamage: [],
        moreElementalDamage: [],
        
        critChance: 0,
        critMultiplier: 0,
        
        projectileDamage: 0,
        areaDamage: 0,
        meleeDamage: 0,
        spellDamage: 0,
        attackDamage: 0,
        dotDamage: 0,
        
        cooldownReduction: 0,
        areaOfEffect: 0,
    };
}

// 添加词条到属性
export function addStatToPlayer(stats: PlayerStats, statType: StatType, value: number): void {
    switch (statType) {
        // 增幅类
        case StatType.INCREASED_DAMAGE:
            stats.increasedDamage += value;
            break;
        case StatType. INCREASED_PHYSICAL_DAMAGE:
            stats.increasedPhysicalDamage += value;
            break;
        case StatType.INCREASED_ELEMENTAL_DAMAGE:
            stats.increasedElementalDamage += value;
            break;
        case StatType.INCREASED_FIRE_DAMAGE:
            stats. increasedFireDamage += value;
            break;
        case StatType.INCREASED_COLD_DAMAGE:
            stats. increasedColdDamage += value;
            break;
        case StatType.INCREASED_LIGHTNING_DAMAGE:
            stats.increasedLightningDamage += value;
            break;
            
        // 额外类（push到数组）
        case StatType. MORE_DAMAGE:
            stats.moreDamage.push(value);
            break;
        case StatType.MORE_PHYSICAL_DAMAGE:
            stats. morePhysicalDamage.push(value);
            break;
        case StatType.MORE_ELEMENTAL_DAMAGE:
            stats.moreElementalDamage.push(value);
            break;
            
        // 暴击类
        case StatType.CRIT_CHANCE:
            stats.critChance += value;
            break;
        case StatType. CRIT_MULTIPLIER:
            stats.critMultiplier += value;
            break;
            
        // 技能类型
        case StatType.PROJECTILE_DAMAGE:
            stats.projectileDamage += value;
            break;
        case StatType.AREA_DAMAGE:
            stats.areaDamage += value;
            break;
        case StatType.MELEE_DAMAGE:
            stats.meleeDamage += value;
            break;
        case StatType.SPELL_DAMAGE:
            stats.spellDamage += value;
            break;
        case StatType. ATTACK_DAMAGE:
            stats.attackDamage += value;
            break;
        case StatType.DOT_DAMAGE:
            stats.dotDamage += value;
            break;
            
        // 其他
        case StatType.COOLDOWN_REDUCTION:
            stats. cooldownReduction += value;
            break;
        case StatType.AREA_OF_EFFECT:
            stats.areaOfEffect += value;
            break;
    }
}

// ========== 伤害计算结果 ==========
export interface DamageResult {
    finalDamage: number;
    dps: number;
    breakdown: {
        baseDamage: number;
        increasedMultiplier: number;
        moreMultiplier: number;
        critMultiplier: number;
        skillTypeMultiplier: number;
        totalMultiplier: number;
    };
    critInfo: {
        chance: number;
        multiplier: number;
    };
    cooldown: number;
}

// ========== 伤害计算器 ==========
export class DamageCalculator {
    
    /**
     * 计算技能伤害
     */
    public static Calculate(
        skillId: string,
        skillLevel: number,
        stats: PlayerStats,
        enemyDebuff: number = 1.0  // 敌人受到的额外伤害
    ): DamageResult | null {
        const skill = SKILL_CONFIG[skillId];
        if (!skill) return null;
        
        // ===== 乘区1：基础伤害 =====
        const baseDamage = skill.baseDamage + skillLevel * skill.damagePerLevel;
        
        // ===== 乘区2：增幅（加法叠加）=====
        let totalIncreased = stats.increasedDamage;
        
        // 根据技能标签添加对应的增幅
        if (skill.tags.includes(SkillTag.PHYSICAL)) {
            totalIncreased += stats.increasedPhysicalDamage;
        }
        if (skill.tags.includes(SkillTag.FIRE) || 
            skill.tags.includes(SkillTag.COLD) || 
            skill.tags. includes(SkillTag. LIGHTNING)) {
            totalIncreased += stats.increasedElementalDamage;
        }
        if (skill.tags.includes(SkillTag.FIRE)) {
            totalIncreased += stats.increasedFireDamage;
        }
        if (skill.tags.includes(SkillTag.COLD)) {
            totalIncreased += stats.increasedColdDamage;
        }
        if (skill.tags.includes(SkillTag.LIGHTNING)) {
            totalIncreased += stats. increasedLightningDamage;
        }
        
        const increasedMultiplier = 1 + totalIncreased / 100;
        
        // ===== 乘区3：额外（乘法叠加）=====
        let moreMultiplier = 1;
        
        // 通用额外伤害
        for (const more of stats.moreDamage) {
            moreMultiplier *= (1 + more / 100);
        }
        
        // 物理/元素额外伤害
        if (skill.tags.includes(SkillTag.PHYSICAL)) {
            for (const more of stats.morePhysicalDamage) {
                moreMultiplier *= (1 + more / 100);
            }
        }
        if (skill.tags.includes(SkillTag.FIRE) || 
            skill.tags. includes(SkillTag. COLD) || 
            skill. tags.includes(SkillTag.LIGHTNING)) {
            for (const more of stats.moreElementalDamage) {
                moreMultiplier *= (1 + more / 100);
            }
        }
        
        // ===== 乘区4：暴击期望 =====
        const totalCritChance = Math.min(
            CRIT_CONFIG.baseCritChance + skill.baseCritChance + stats.critChance,
            CRIT_CONFIG.maxCritChance
        );
        const totalCritMultiplier = Math.min(
            CRIT_CONFIG.baseCritMultiplier + stats.critMultiplier,
            CRIT_CONFIG.maxCritMultiplier
        );
        
        // 暴击期望乘数 = 1 + 暴击率 × (暴击伤害 - 100) / 100
        const critExpectedMultiplier = 1 + (totalCritChance / 100) * ((totalCritMultiplier - 100) / 100);
        
        // ===== 乘区5：技能类型（加法叠加）=====
        let totalSkillType = 0;
        
        if (skill.tags.includes(SkillTag.PROJECTILE)) {
            totalSkillType += stats.projectileDamage;
        }
        if (skill. tags.includes(SkillTag.AREA)) {
            totalSkillType += stats.areaDamage;
        }
        if (skill.tags.includes(SkillTag.MELEE)) {
            totalSkillType += stats.meleeDamage;
        }
        if (skill.tags.includes(SkillTag.SPELL)) {
            totalSkillType += stats.spellDamage;
        }
        if (skill. tags.includes(SkillTag.ATTACK)) {
            totalSkillType += stats.attackDamage;
        }
        if (skill.tags.includes(SkillTag.DOT)) {
            totalSkillType += stats.dotDamage;
        }
        
        const skillTypeMultiplier = 1 + totalSkillType / 100;
        
        // ===== 最终计算 =====
        const totalMultiplier = increasedMultiplier * moreMultiplier * critExpectedMultiplier * skillTypeMultiplier * enemyDebuff;
        const finalDamage = Math.floor(baseDamage * totalMultiplier);
        
        // ===== 冷却计算 =====
        const baseCooldown = skill.baseCooldown - skillLevel * skill.cooldownPerLevel;
        const cooldown = Math.max(1, baseCooldown * (1 - stats.cooldownReduction / 100));
        
        // ===== DPS =====
        const dps = cooldown > 0 ? Math.floor(finalDamage / cooldown) : finalDamage;
        
        return {
            finalDamage,
            dps,
            breakdown: {
                baseDamage,
                increasedMultiplier,
                moreMultiplier,
                critMultiplier: critExpectedMultiplier,
                skillTypeMultiplier,
                totalMultiplier,
            },
            critInfo: {
                chance: totalCritChance,
                multiplier: totalCritMultiplier,
            },
            cooldown,
        };
    }
}