import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";
import { RageSystem } from "../../modules/rage_system";

@registerModifier()
export class modifier_rage_attack_listener extends BaseModifier {
    IsHidden() { return true; }
    IsPurgable() { return false; }
    RemoveOnDeath() { return false; }
    
    OnCreated() {
        if (!IsServer()) return;
        print(`[modifier_rage_attack_listener] ✓ Modifier created on ${this.GetParent().GetUnitName()}`);
    }
    
    DeclareFunctions() {
        return [
            ModifierFunction.ON_ATTACK_LANDED
        ];
    }
    
    OnAttackLanded(event: ModifierAttackEvent) {
        if (!IsServer()) return;
        
        const parent = this.GetParent();  // 修改器的拥有者（斧王）
        const attacker = event.attacker;   // 攻击者
        const target = event.target;       // 被攻击者
        
        // ⭐ 关键：只有当拥有者是攻击者时才增加怒气
        if (attacker === parent && target && target.IsAlive()) {
            print(`[modifier_rage_attack_listener] 💥 ${parent.GetUnitName()} attacked ${target.GetUnitName()}`);
            RageSystem.OnHeroAttack(parent as CDOTA_BaseNPC_Hero, target);
        } else if (target === parent) {
            // 调试：被攻击时输出日志，但不增加怒气
            print(`[modifier_rage_attack_listener] ℹ️ ${parent.GetUnitName()} was attacked by ${attacker.GetUnitName()}, no rage gain`);
        }
    }
}