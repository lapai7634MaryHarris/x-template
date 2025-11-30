/**
 * 伤害系统测试
 * 聊天输入 -testdamage 查看计算结果
 */

import { DamageCalculator, createEmptyStats, addStatToPlayer, PlayerStats } from './damage_calculator';
import { PlayerStatsCollector } from './player_stats_collector';
import { StatType, SKILL_CONFIG } from '../config/damage_config';

export function InitDamageTest(): void {
    print('[DamageTest] 初始化伤害测试命令');
    
    // 监听聊天消息
    ListenToGameEvent('player_chat', (event: any) => {
        const playerId = event.playerid as PlayerID;
        const text = event.text as string;
        
        if (text === '-testdamage') {
            TestDamageCalculation(playerId);
        }
        
        if (text === '-teststats') {
            TestStatsCollection(playerId);
        }
        
        if (text === '-testall') {
            TestAllSkills(playerId);
        }
    }, null);
}

// 测试伤害计算
function TestDamageCalculation(playerId: PlayerID): void {
    print('');
    print('========================================');
    print('[DamageTest] 测试伤害计算');
    print('========================================');
    
    // 收集玩家属性
    const stats = PlayerStatsCollector.CollectStats(playerId);
    
    // 测试雷霆一击
    const skillId = 'warrior_thunder_strike';
    const skillLevel = 3;
    
    const result = DamageCalculator.Calculate(skillId, skillLevel, stats);
    
    if (! result) {
        print('[DamageTest] 计算失败，技能不存在: ' + skillId);
        return;
    }
    
    print('');
    print('技能: ' + SKILL_CONFIG[skillId]?.name || skillId);
    print('等级: ' + skillLevel);
    print('');
    print('--- 乘区分解 ---');
    print('基础伤害: ' + result.breakdown.baseDamage);
    print('增幅乘区(Increased): x' + result.breakdown.increasedMultiplier. toFixed(3));
    print('额外乘区(More): x' + result.breakdown. moreMultiplier.toFixed(3));
    print('暴击乘区(期望): x' + result.breakdown.critMultiplier.toFixed(3));
    print('技能类型乘区: x' + result.breakdown.skillTypeMultiplier.toFixed(3));
    print('总乘数: x' + result.breakdown.totalMultiplier.toFixed(3));
    print('');
    print('--- 最终结果 ---');
    print('最终伤害: ' + result.finalDamage);
    print('冷却时间: ' + result.cooldown. toFixed(1) + 's');
    print('DPS: ' + result.dps);
    print('暴击率: ' + result. critInfo.chance + '%');
    print('暴击伤害: ' + result.critInfo.multiplier + '%');
    print('========================================');
    print('');
    
    // 发送消息到游戏内
    GameRules.SendCustomMessage(
        `<font color='#ffd700'>===== 伤害测试 =====</font>`,
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        `<font color='#fff'>技能: ${SKILL_CONFIG[skillId]?.name} Lv.${skillLevel}</font>`,
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        `<font color='#0f0'>基础伤害: ${result. breakdown.baseDamage}</font>`,
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        `<font color='#0af'>增幅: x${result.breakdown.increasedMultiplier.toFixed(2)} | 额外: x${result.breakdown. moreMultiplier.toFixed(2)}</font>`,
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        `<font color='#f0a'>暴击: ${result.critInfo.chance}% / ${result.critInfo.multiplier}%</font>`,
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        `<font color='#f80'>最终伤害: ${result. finalDamage} | DPS: ${result.dps}</font>`,
        playerId,
        0
    );
}

// 测试属性收集
function TestStatsCollection(playerId: PlayerID): void {
    print('');
    print('========================================');
    print('[DamageTest] 测试属性收集');
    print('========================================');
    
    const stats = PlayerStatsCollector.CollectStats(playerId);
    
    print('');
    print('--- 增幅类(Increased) ---');
    print('通用增伤: ' + stats.increasedDamage + '%');
    print('物理增伤: ' + stats.increasedPhysicalDamage + '%');
    print('元素增伤: ' + stats.increasedElementalDamage + '%');
    print('火焰增伤: ' + stats.increasedFireDamage + '%');
    print('冰霜增伤: ' + stats.increasedColdDamage + '%');
    print('闪电增伤: ' + stats.increasedLightningDamage + '%');
    print('');
    print('--- 额外类(More) ---');
    print('额外伤害数量: ' + stats.moreDamage. length);
    if (stats.moreDamage. length > 0) {
        print('额外伤害值: ' + stats.moreDamage. join(', ') + '%');
    }
    print('');
    print('--- 暴击类 ---');
    print('暴击率: ' + stats.critChance + '%');
    print('暴击伤害: ' + stats.critMultiplier + '%');
    print('');
    print('--- 技能类型 ---');
    print('投射物伤害: ' + stats.projectileDamage + '%');
    print('范围伤害: ' + stats.areaDamage + '%');
    print('近战伤害: ' + stats.meleeDamage + '%');
    print('法术伤害: ' + stats.spellDamage + '%');
    print('');
    print('--- 其他 ---');
    print('冷却缩减: ' + stats.cooldownReduction + '%');
    print('范围扩大: ' + stats.areaOfEffect + '%');
    print('========================================');
    print('');
    
    // 发送消息到游戏内
    GameRules.SendCustomMessage(
        `<font color='#ffd700'>===== 属性收集测试 =====</font>`,
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        `<font color='#0f0'>增伤: ${stats.increasedDamage}% | 暴击率: ${stats.critChance}% | 暴击伤害: ${stats.critMultiplier}%</font>`,
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        `<font color='#0af'>冷却缩减: ${stats.cooldownReduction}% | 范围扩大: ${stats.areaOfEffect}%</font>`,
        playerId,
        0
    );
}

// 测试所有技能
function TestAllSkills(playerId: PlayerID): void {
    print('');
    print('========================================');
    print('[DamageTest] 测试所有技能');
    print('========================================');
    
    const stats = PlayerStatsCollector.CollectStats(playerId);
    
    GameRules.SendCustomMessage(
        `<font color='#ffd700'>===== 所有技能伤害 =====</font>`,
        playerId,
        0
    );
    
    for (const skillId in SKILL_CONFIG) {
        const skill = SKILL_CONFIG[skillId];
        const result = DamageCalculator.Calculate(skillId, 3, stats);  // 假设3级
        
        if (result) {
            const tags = skill.tags. join(', ');
            print(`${skill.name}: 伤害=${result.finalDamage} DPS=${result.dps} 标签=[${tags}]`);
            
            GameRules.SendCustomMessage(
                `<font color='#fff'>${skill.name}:</font> <font color='#f80'>${result.finalDamage}</font> <font color='#888'>(DPS:${result.dps})</font>`,
                playerId,
                0
            );
        }
    }
    
    print('========================================');
}