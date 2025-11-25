import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";

@registerAbility()
export class warrior_thunder_strike extends BaseAbility {
    
    OnAbilityPhaseStart(): boolean {
        const caster = this.GetCaster();
        const caster_position = caster.GetAbsOrigin();
        
        // 🔧 蓄力特效（可选）
        const charge = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_zuus/zuus_arc_lightning.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            caster
        );
        ParticleManager.SetParticleControl(charge, 0, caster_position);
        ParticleManager.ReleaseParticleIndex(charge);
        
        caster.EmitSound("Hero_Zuus.ArcLightning.Cast");
        
        return true;
    }
    
    OnSpellStart(): void {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        const caster_position = caster.GetAbsOrigin();
        
        const radius = this.GetSpecialValueFor("radius") || 600;
        const damage_pct = this.GetSpecialValueFor("damage_pct") || 1.5;
        
        const attackDamage = (caster.GetBaseDamageMin() + caster.GetBaseDamageMax()) / 2;
        const damage = attackDamage * damage_pct;
        
        print(`[warrior_thunder_strike] Casting, Damage: ${damage.toFixed(0)}, Radius: ${radius}`);
        
        // 🔧 熊猫雷霆一击（地面冲击波）
        const thunder_clap = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_brewmaster/brewmaster_thunder_clap.vpcf",
            ParticleAttachment.ABSORIGIN,
            caster
        );
        ParticleManager.SetParticleControl(thunder_clap, 0, caster_position);
        ParticleManager.SetParticleControl(thunder_clap, 1, Vector(radius, radius, radius));
        ParticleManager.ReleaseParticleIndex(thunder_clap);
        
        // 🔧 音效 + 屏幕震动
        EmitSoundOnLocationWithCaster(caster_position, "Hero_Brewmaster.ThunderClap", caster);
        ScreenShake(caster_position, 350, 450, 1.2, radius * 2, 0, true);
        
        caster.StartGesture(GameActivity.DOTA_CAST_ABILITY_3);
        
        // 🔧 寻找敌人
        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            caster_position,
            undefined,
            radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO + UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );
        
        print(`[warrior_thunder_strike] Found ${enemies.length} enemies`);
        
        // 🔧 宙斯闪电（从天而降）
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy || !enemy.IsAlive()) continue;
            
            Timers.CreateTimer(i * 0.08, () => {
                if (!enemy || !enemy.IsAlive()) return;
                
                const enemy_position = enemy.GetAbsOrigin();
                
                // 🔧 闪电起点（敌人上方 1000 单位）
                const lightning_start = enemy_position.__add(Vector(0, 0, 1000)) as Vector;
                
                // 🔧 创建宙斯闪电（从天而降）
                const lightning = ParticleManager.CreateParticle(
                    "particles/units/heroes/hero_zuus/zuus_lightning_bolt.vpcf",
                    ParticleAttachment.WORLDORIGIN,  // 使用 WORLDORIGIN
                    undefined
                );
                
                // 控制点 0：闪电起点（天空）
                ParticleManager.SetParticleControl(lightning, 0, lightning_start);
                
                // 控制点 1：闪电终点（敌人位置）
                ParticleManager.SetParticleControl(lightning, 1, enemy_position);
                
                // 控制点 2：闪电参数
                ParticleManager.SetParticleControl(lightning, 2, Vector(0, 0, 0));
                
                ParticleManager.ReleaseParticleIndex(lightning);
                
                // 🔧 闪电音效
                EmitSoundOnLocationWithCaster(enemy_position, "Hero_Zuus.LightningBolt", caster);
                
                // 🔧 造成伤害
                ApplyDamage({
                    victim: enemy,
                    attacker: caster,
                    damage: damage,
                    damage_type: DamageTypes.MAGICAL,
                    ability: this,
                });
                
                // 🔧 应用重伤
                this.ApplyDeepWound(caster, enemy);
                
                print(`[warrior_thunder_strike] ⚡ Lightning struck ${enemy.GetUnitName()} from sky`);
            });
        }
        
        this.UseResources(false, false, false, true);
    }
    
    ApplyDeepWound(attacker: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): void {
        const deepWoundAbility = attacker.FindAbilityByName("warrior_deep_wound");
        if (!deepWoundAbility) {
            print("[warrior_thunder_strike] ✗ Deep Wound ability not found!");
            return;
        }
        
        const duration = deepWoundAbility.GetSpecialValueFor("duration") || 6;
        const attackDamage = (attacker.GetBaseDamageMin() + attacker.GetBaseDamageMax()) / 2;
        
        const base_multiplier = deepWoundAbility.GetSpecialValueFor("base_multiplier") || 0.7;
        const damage_multiplier = deepWoundAbility.GetSpecialValueFor("damage_multiplier") || 0.6;
        const damage_to_add = attackDamage * base_multiplier * damage_multiplier * duration;
        
        const existingDebuff = target.FindModifierByName("modifier_warrior_deep_wound_debuff");
        
        if (existingDebuff) {
            const debuffInstance = existingDebuff as any;
            if (debuffInstance.AddDamageToPool) {
                debuffInstance.AddDamageToPool(damage_to_add);
            }
            target.EmitSound("Hero_PhantomAssassin.CoupDeGrace");
        } else {
            target.AddNewModifier(
                attacker,
                deepWoundAbility,
                "modifier_warrior_deep_wound_debuff",
                {
                    duration: duration,
                    initial_damage: damage_to_add,
                }
            );
            target.EmitSound("Hero_Bloodseeker.Rupture");
        }
    }
}