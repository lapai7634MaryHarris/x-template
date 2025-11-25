import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";

@registerModifier()
export class modifier_axe_giant_strike_debuff extends BaseModifier {
    IsHidden(): boolean { return false; }
    IsPurgable(): boolean { return true; }
    IsDebuff(): boolean { return true; }
    
    GetTexture(): string {
        return "axe_culling_blade";
    }
    
    OnCreated(): void {
        if (!IsServer()) return;
        
        const parent = this.GetParent();
        const caster = this.GetCaster();
        
        print(`[modifier_axe_giant_strike_debuff] Applied to ${parent.GetUnitName()} by ${caster?.GetUnitName()}`);
    }
    
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.INCOMING_DAMAGE_PERCENTAGE
        ];
    }
    
    GetModifierIncomingDamage_Percentage(event: ModifierAttackEvent): number {
        if (!IsServer()) return 0;
        
        const attacker = event.attacker;
        const caster = this.GetCaster();
        
        // 只有当攻击者是施法者时，才增加伤害
        if (attacker && caster && attacker === caster) {
            const amplify = this.GetAbility()!.GetSpecialValueFor("damage_amplify");
            
            print(`[modifier_axe_giant_strike_debuff] Amplifying damage by ${amplify}%`);
            
            return amplify;  // 返回 30，表示额外 30% 伤害
        }
        
        return 0;
    }
    
    GetEffectName(): string {
        return "particles/units/heroes/hero_skeletonking/wraith_king_vampiric_aura_debuff.vpcf";
    }
    
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }
    
    GetStatusEffectName(): string {
        return "particles/status_fx/status_effect_burn.vpcf";
    }
    
    StatusEffectPriority(): number {
        return 10;
    }
}