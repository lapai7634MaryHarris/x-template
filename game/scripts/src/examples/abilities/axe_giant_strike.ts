import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";
import { RageSystem } from "../../modules/rage_system";

@registerAbility()
export class axe_giant_strike extends BaseAbility {
    
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        if (!caster) return UnitFilterResult.FAIL_CUSTOM;
        
        // 🔧 先检查 target 是否存在
        if (!target) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        
        // 🔧 再检查怒气（在检查目标之前）
        const abilityName = this.GetAbilityName();
        if (!RageSystem.CanCastAbility(caster, abilityName)) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        
        // 🔧 最后检查目标状态（现在 target 肯定不是 nil）
        if (target.IsInvulnerable()) {
            return UnitFilterResult.FAIL_INVULNERABLE;
        }
        if (!target.IsAlive()) {
            return UnitFilterResult.FAIL_DEAD;
        }
        
        return UnitFilterResult.SUCCESS;
    }
    
    GetCustomCastErrorTarget(target: CDOTA_BaseNPC): string {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        if (!caster) return "";
        
        const abilityName = this.GetAbilityName();
        if (!RageSystem.CanCastAbility(caster, abilityName)) {
            const rageCost = this.GetSpecialValueFor("rage_cost") || 20;
            const currentRage = RageSystem.GetRage(caster);
            
            caster.EmitSound("General.CastFail_InvalidTarget_Hero");
            
            const playerOwner = caster.GetPlayerOwner();
            if (playerOwner) {
                SendOverheadEventMessage(playerOwner, 10, caster, 0, playerOwner);
            }
            
            return `怒气不足！需要 ${rageCost}，当前 ${currentRage}`;
        }
        
        return "";
    }
    
    OnSpellStart(): void {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        const target = this.GetCursorTarget() as CDOTA_BaseNPC;
        
        if (!target) {
            print("[axe_giant_strike] No target!");
            return;
        }
        
        const abilityName = this.GetAbilityName();
        
        if (!RageSystem.TryConsumeAbilityRage(caster, abilityName)) {
            print("[axe_giant_strike] Failed to consume rage!");
            return;
        }
        
        print(`[axe_giant_strike] ✓ Casting on ${target.GetUnitName()}`);
        
        const damageMultiplier = this.GetSpecialValueFor("damage_multiplier") || 1.5;
        const duration = this.GetSpecialValueFor("duration") || 5.0;
        
        caster.EmitSound("Hero_Axe.Attack");
        target.EmitSound("Hero_Axe.Culling_Blade_Success");
        caster.MoveToTargetToAttack(target);
        
        const attackMin = caster.GetBaseDamageMin();
        const attackMax = caster.GetBaseDamageMax();
        const avgAttack = (attackMin + attackMax) / 2;
        const damage = avgAttack * damageMultiplier;
        
        print(`[axe_giant_strike] Damage: ${damage}`);
        
        ApplyDamage({
            victim: target,
            attacker: caster,
            damage: damage,
            damage_type: DamageTypes.PHYSICAL,
            ability: this
        });
        
        const particleName = "particles/units/heroes/hero_sven/sven_spell_gods_strength.vpcf";
        const particle = ParticleManager.CreateParticle(
            particleName,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            target
        );
        ParticleManager.SetParticleControl(particle, 0, target.GetAbsOrigin());
        ParticleManager.ReleaseParticleIndex(particle);
        
        const debuff = target.AddNewModifier(
            caster,
            this,
            "modifier_axe_giant_strike_debuff",
            { duration: duration }
        );
        
        if (debuff) {
            print(`[axe_giant_strike] ✓ Debuff applied`);
        }
        
        ScreenShake(target.GetAbsOrigin(), 100, 150, 0.5, 500, 0, true);
    }
}