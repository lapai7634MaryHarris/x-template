// 示例：雷霆一击技能

import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";
import { DamageCalculator } from "../../systems/damage_calculator";
import { PlayerStatsCollector } from "../../systems/player_stats_collector";

@registerAbility()
export class warrior_thunder_strike extends BaseAbility {
    
    OnSpellStart(): void {
        const caster = this.GetCaster();
        const playerId = caster.GetPlayerOwnerID();
        const skillLevel = this.GetLevel();
        
        // 收集玩家属性
        const stats = PlayerStatsCollector.CollectStats(playerId);
        
        // 计算伤害
        const result = DamageCalculator.Calculate(
            'warrior_thunder_strike',
            skillLevel,
            stats
        );
        
        if (! result) return;
        
        print(`[ThunderStrike] 最终伤害: ${result. finalDamage}`);
        print(`[ThunderStrike] 增幅乘区: ${result.breakdown.increasedMultiplier. toFixed(2)}`);
        print(`[ThunderStrike] 额外乘区: ${result.breakdown.moreMultiplier.toFixed(2)}`);
        print(`[ThunderStrike] 暴击期望: ${result.breakdown.critMultiplier.toFixed(2)}`);
        print(`[ThunderStrike] 技能类型: ${result.breakdown.skillTypeMultiplier.toFixed(2)}`);
        
        // 获取目标点
        const targetPoint = this.GetCursorPosition();
        const radius = 300 * (1 + stats.areaOfEffect / 100);  // 应用范围加成
        
        // 查找范围内敌人
        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            targetPoint,
            undefined,
            radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType. HERO + UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );
        
        // 对每个敌人造成伤害
        for (const enemy of enemies) {
            // 判断是否暴击
            const isCrit = RandomFloat(0, 100) < result.critInfo.chance;
            let damage = result.finalDamage;
            
            if (isCrit) {
                // 暴击时使用实际暴击伤害，而不是期望值
                // 需要重新计算：基础伤害 × 其他乘区 × 实际暴击倍率
                damage = Math.floor(
                    result.breakdown.baseDamage *
                    result.breakdown.increasedMultiplier *
                    result.breakdown.moreMultiplier *
                    result.breakdown.skillTypeMultiplier *
                    (result.critInfo.multiplier / 100)
                );
                
                // 显示暴击特效
                this.ShowCritEffect(enemy);
            }
            
            ApplyDamage({
                victim: enemy,
                attacker: caster,
                damage: damage,
                damage_type: DamageTypes.MAGICAL,
                ability: this,
            });
            
            // 显示伤害数字
            SendOverheadEventMessage(
                undefined,
                isCrit ? OverheadAlert.CRITICAL : OverheadAlert.DAMAGE,
                enemy,
                damage,
                undefined
            );
        }
        
        // 播放特效
        ParticleManager.CreateParticle(
            "particles/units/heroes/hero_zuus/zuus_arc_lightning.vpcf",
            ParticleAttachment.WORLDORIGIN,
            caster
        );
        
        // 播放音效
        EmitSoundOnLocationWithCaster(targetPoint, "Hero_Zuus. ArcLightning.Target", caster);
    }
    
    private ShowCritEffect(target: CDOTA_BaseNPC): void {
        const particle = ParticleManager.CreateParticle(
            "particles/generic_gameplay/generic_crit_impact.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            target
        );
        ParticleManager.ReleaseParticleIndex(particle);
    }
}