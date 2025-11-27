import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";

@registerAbility()
export class warrior_sudden_death extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return "modifier_sudden_death";
    }
}

@registerModifier()
export class modifier_sudden_death extends BaseModifier {
    IsHidden(): boolean { return true; }
    IsPurgable(): boolean { return false; }
    IsDebuff(): boolean { return false; }
    RemoveOnDeath(): boolean { return false; }
    
    sudden_death_chance: number = 10;
    
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED];
    }
    
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (!IsServer()) return;
        
        const attacker = event.attacker;  
        const parent = this.GetParent();
        
        if (attacker !== parent) return;// 只处理拥有者的攻击事件
        
        if (RandomInt(1, 100) <= this.sudden_death_chance) {// 触发10%几率
            print("[modifier_sudden_death] ⚡ Sudden Death triggered!");;
            
            parent.AddNewModifier(
                parent,
                this.GetAbility(),
                "modifier_sudden_death_active",
                { duration: -1 }
            );// 永久效果，直到手动移除
            
            const executeAbility = parent.FindAbilityByName("warrior_execute");
            if (executeAbility && !executeAbility.IsCooldownReady()) {
                executeAbility.EndCooldown();
            }// 立即刷新技能冷却
            
            const particle = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_juggernaut/juggernaut_crit_blur.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                parent
            );
            ParticleManager.ReleaseParticleIndex(particle);
            
            parent.EmitSound("DOTA_Item.Daedelus.Crit");
        }
    }
}

@registerModifier()
export class modifier_sudden_death_active extends BaseModifier {
    IsHidden(): boolean { return false; }
    IsPurgable(): boolean { return false; }
    IsDebuff(): boolean { return false; }
    
    GetTexture(): string {
        return "juggernaut_blade_fury";
    }
    
    OnCreated(): void {
        if (!IsServer()) return;
        
        const parent = this.GetParent();
        
        const particle = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_bloodseeker/bloodseeker_rupture_glow.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            parent
        );
        this.AddParticle(particle, false, false, -1, false, false);
    }
    
    GetEffectName(): string {
        return "particles/units/heroes/hero_bloodseeker/bloodseeker_rupture_glow.vpcf";
    }
    
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }
}