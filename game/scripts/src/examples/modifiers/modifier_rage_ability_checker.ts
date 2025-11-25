import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";
import { RageSystem } from "../../modules/rage_system";

@registerModifier()
export class modifier_rage_ability_checker extends BaseModifier {
    IsHidden(): boolean { return true; }
    IsPurgable(): boolean { return false; }
    RemoveOnDeath(): boolean { return false; }
    
    private lastRageCheck: number = -1;
    
    OnCreated(): void {
        if (!IsServer()) return;
        const ability = this.GetAbility();
        if (ability) {
            print(`[modifier_rage_ability_checker] Created for ${ability.GetAbilityName()}`);
        }
        
        // 每 0.1 秒检查一次怒气，实时刷新技能按钮状态
        this.StartIntervalThink(0.1);
    }
    
    OnIntervalThink(): void {
        if (!IsServer()) return;
        
        const ability = this.GetAbility();
        const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
        
        if (!ability || !parent) return;
        
        const currentRage = RageSystem.GetRage(parent);
        
        // 只有当怒气值变化时才刷新（避免频繁调用）
        if (currentRage !== this.lastRageCheck) {
            this.lastRageCheck = currentRage;
            
            // 🔧 强制刷新技能状态
            // 通过设置技能等级来触发状态更新
            const currentLevel = ability.GetLevel();
            if (currentLevel > 0) {
                ability.SetLevel(currentLevel);
            }
        }
    }
    
    DeclareFunctions(): ModifierFunction[] {
        return [];
    }
}