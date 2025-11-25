import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";
import { RageSystem } from "../../modules/rage_system";

@registerAbility()
export class warrior_execute extends BaseAbility {
    
    // 施法目标过滤：校验目标有效性和怒气充足性
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        if (!caster) return UnitFilterResult.FAIL_CUSTOM;

        // 检查目标是否存在
        if (!target) return UnitFilterResult.FAIL_CUSTOM;

        // 复用RageSystem检查怒气（普通模式至少25）
        const abilityName = this.GetAbilityName();
        if (!RageSystem.CanCastAbility(caster, abilityName)) {
            return UnitFilterResult.FAIL_CUSTOM;
        }

        // 检查目标状态（无敌/死亡）
        if (target.IsInvulnerable()) return UnitFilterResult.FAIL_INVULNERABLE;
        if (!target.IsAlive()) return UnitFilterResult.FAIL_DEAD;

        return UnitFilterResult.SUCCESS;
    }
    
    // 自定义施法错误提示（怒气不足时）
    GetCustomCastErrorTarget(target: CDOTA_BaseNPC): string {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        if (!caster) return "";

        const abilityName = this.GetAbilityName();
        if (!RageSystem.CanCastAbility(caster, abilityName)) {
            const rageCost = this.GetSpecialValueFor("rage_cost") || 25;
            const currentRage = RageSystem.GetRage(caster);

            // 播放错误音效（确保caster非空）
            if (caster) caster.EmitSound("General.CastFail_InvalidTarget_Hero");

            // 显示头顶提示
            const playerOwner = caster.GetPlayerOwner();
            if (playerOwner) {
                SendOverheadEventMessage(playerOwner, 10, caster, 0, playerOwner);
            }

            return `怒气不足！需要 ${rageCost}，当前 ${currentRage}`;
        }

        return "";
    }
    
    // 技能释放核心逻辑
    OnSpellStart(): void {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        const target = this.GetCursorTarget() as CDOTA_BaseNPC;
        // 双重校验：确保施法者和目标有效
        if (!caster || !target || !target.IsAlive()) {
            print("[warrior_execute] 无效目标或施法者！");
            return;
        }
        
        const abilityName = this.GetAbilityName();
        const currentRage = RageSystem.GetRage(caster);
        const rageCostNormal = this.GetSpecialValueFor("rage_cost") || 25;

        // 判断是否为处决模式（目标血量≤20% 或 有猝死激活状态）
        const targetHpPercent = (target.GetHealth() / target.GetMaxHealth()) * 100;
        const hasSuddenDeath = caster.HasModifier("modifier_sudden_death_active");
        const isExecute = targetHpPercent <= 20 || hasSuddenDeath;
        
        // 计算伤害（修复核心错误：补充damage赋值）
        const attack = (caster.GetBaseDamageMin() + caster.GetBaseDamageMax()) / 2; // 平均攻击力
        const strength = caster.GetStrength(); // 力量值
        let damage: number;
        if (isExecute) {
            // 处决模式伤害：(当前怒气 / 12) * (攻击力 + 力量)
            damage = (currentRage / 12) * (attack + strength);
        } else {
            // 普通模式伤害：200% * (攻击力 + 力量)
            damage = (attack + strength) * 2.0;
        }
   
        // 消耗怒气
        let rageConsumed = false;
        if (isExecute) {
            // 处决模式：消耗所有怒气（已在CastFilter中确保≥25）
            RageSystem.SetRage(caster, 0);
            rageConsumed = true;
        } else {
            // 普通模式：消耗固定怒气（复用TryConsume）
            rageConsumed = RageSystem.TryConsumeAbilityRage(caster, abilityName);
        }

        if (!rageConsumed) {
            print("[warrior_execute] 怒气消耗失败！");
            return;
        }
        
        // 移除猝死激活状态（若存在）
        if (hasSuddenDeath) {
            caster.RemoveModifierByName("modifier_sudden_death_active");
        }
        
        // 施法动作
        caster.StartGesture(GameActivity.DOTA_CAST_ABILITY_4);
        caster.MoveToTargetToAttack(target);
        
        // 特效与音效
        if (isExecute) {
            // 处决特效（金色）
            const particle = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_juggernaut/juggernaut_omni_slash_tgt.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                target
            );
            ParticleManager.SetParticleControl(particle, 0, target.GetAbsOrigin());
            ParticleManager.ReleaseParticleIndex(particle);
            
            caster.EmitSound("Hero_Axe.Culling_Blade_Success");
            target.EmitSound("Hero_Juggernaut.OmniSlash.Damage");
            ScreenShake(target.GetAbsOrigin(), 200, 300, 1.0, 800, 0, true);
        } else {
            // 普通特效（红色）
            const particle = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_phantom_assassin/phantom_assassin_crit_impact.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                target
            );
            ParticleManager.SetParticleControl(particle, 0, target.GetAbsOrigin());
            ParticleManager.ReleaseParticleIndex(particle);
            
            caster.EmitSound("Hero_PhantomAssassin.CoupDeGrace");
        }
        
        // 造成伤害
        ApplyDamage({
            victim: target,
            attacker: caster,
            damage: damage,
            damage_type: DamageTypes.PHYSICAL,
            ability: this,
        });
        
        // 显示头顶伤害数字（4=处决特效，3=普通暴击）
        SendOverheadEventMessage(
            undefined,
            isExecute ? 4 : 3,
            target,
            damage,
            undefined
        );
        
        // 冷却缩短：仅当目标在斩杀线以下（≤20%血量）时生效（修复逻辑偏差）
        if (targetHpPercent <= 20) {
            this.StartCooldown(3);
            print(`[warrior_execute] 冷却缩短至3秒（目标血量${targetHpPercent.toFixed(1)}%）`);
        }
        
        print(`[warrior_execute] 技能释放完成！伤害：${damage.toFixed(0)}`);
    }
}