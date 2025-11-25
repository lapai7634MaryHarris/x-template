import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";

@registerAbility()
export class warrior_deep_wound extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return "modifier_warrior_deep_wound";
    }
}

@registerModifier()
export class modifier_warrior_deep_wound extends BaseModifier {
    IsHidden(): boolean { return true; }
    IsPurgable(): boolean { return false; }
    IsDebuff(): boolean { return false; }
    RemoveOnDeath(): boolean { return false; }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ON_ATTACK_LANDED,
            ModifierFunction.PREATTACK_CRITICALSTRIKE,  // 🔧 监听暴击计算
        ];
    }

    OnCreated(): void {
        if (!IsServer()) return;
        print("[modifier_warrior_deep_wound] Passive activated");
    }

    // 🔧 记录暴击状态
    private lastAttackWasCrit: boolean = false;

    // 🔧 暴击计算时触发
    GetModifierPreAttack_CriticalStrike(event: ModifierAttackEvent): number {
        if (!IsServer()) return 0;

        const parent = this.GetParent();
        if (event.attacker !== parent) return 0;

        // 🔧 检测是否有暴击
        // 如果其他装备/技能触发了暴击，这里会被调用
        // 我们只需要记录一下，不修改暴击倍率
        this.lastAttackWasCrit = true;

        // 延迟重置标志
        Timers.CreateTimer(0.1, () => {
            this.lastAttackWasCrit = false;
        });

        return 0;  // 不修改暴击倍率
    }

    // 🔧 攻击命中时检测
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (!IsServer()) return;

        const attacker = event.attacker;
        const target = event.target;
        const parent = this.GetParent();

        if (attacker !== parent) return;
        if (!target || !target.IsAlive()) return;

        // 🔧 如果上次攻击是暴击，触发重伤
        if (this.lastAttackWasCrit) {
            this.ApplyDeepWound(attacker as CDOTA_BaseNPC_Hero, target);
            this.lastAttackWasCrit = false;  // 重置标志
        }
    }

    ApplyDeepWound(attacker: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): void {
        const ability = this.GetAbility();
        if (!ability) return;

        const duration = ability.GetSpecialValueFor("duration") || 6;

        // 计算基础攻击力
        const attackDamage = (attacker.GetBaseDamageMin() + attacker.GetBaseDamageMax()) / 2;

        // 🔧 计算要添加到伤害池的伤害
        const base_multiplier = ability.GetSpecialValueFor("base_multiplier") || 0.7;
        const damage_multiplier = ability.GetSpecialValueFor("damage_multiplier") || 0.6;
        const damage_to_add = attackDamage * base_multiplier * damage_multiplier * duration;

        print(`[modifier_warrior_deep_wound] ✓ Crit detected! Adding ${damage_to_add.toFixed(1)} damage to pool on ${target.GetUnitName()}`);

        // 🔧 检查目标是否已有 Debuff
        const existingDebuff = target.FindModifierByName("modifier_warrior_deep_wound_debuff");
        
        if (existingDebuff) {
            const debuffInstance = existingDebuff as modifier_warrior_deep_wound_debuff;
            debuffInstance.AddDamageToPool(damage_to_add);
            
            const particle = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_phantom_assassin/phantom_assassin_crit_impact.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                target
            );
            ParticleManager.ReleaseParticleIndex(particle);
        } else {
            target.AddNewModifier(
                attacker,
                ability,
                "modifier_warrior_deep_wound_debuff",
                {
                    duration: duration,
                    initial_damage: damage_to_add,
                }
            );

            const particle = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_bloodseeker/bloodseeker_rupture.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                target
            );
            ParticleManager.ReleaseParticleIndex(particle);

            target.EmitSound("Hero_Bloodseeker.Rupture.Cast");
        }
    }
}

@registerModifier()
export class modifier_warrior_deep_wound_debuff extends BaseModifier {
    damage_pool: number = 0;
    tick_rate: number = 0.5;
    pool_drain_rate: number = 0.2;
    max_duration: number = 6;

    IsHidden(): boolean { return false; }
    IsPurgable(): boolean { return true; }
    IsDebuff(): boolean { return true; }

    OnCreated(params: any): void {
        if (!IsServer()) return;

        const ability = this.GetAbility();
        if (!ability) return;

        this.damage_pool = Number(params.initial_damage) || 0;
        this.max_duration = ability.GetSpecialValueFor("duration") || 6;
        this.tick_rate = ability.GetSpecialValueFor("tick_rate") || 0.5;
        this.pool_drain_rate = ability.GetSpecialValueFor("pool_drain_rate") || 0.2;

        print(`[modifier_warrior_deep_wound_debuff] Created with damage pool: ${this.damage_pool.toFixed(1)}`);

        this.StartIntervalThink(this.tick_rate);
        
        // 🔧 播放持续音效
        if (IsServer()) {
            const parent = this.GetParent();
            parent.EmitSound("Hero_Bloodseeker.Rupture");
        }
    }

    AddDamageToPool(damage: number): void {
        if (!IsServer()) return;

        this.damage_pool += damage;
        
        print(`[modifier_warrior_deep_wound_debuff] ✓ Added ${damage.toFixed(1)} to pool, Total: ${this.damage_pool.toFixed(1)}`);

        this.SetDuration(this.max_duration, true);

        const parent = this.GetParent();
        parent.EmitSound("Hero_PhantomAssassin.CoupDeGrace");
    }

    OnIntervalThink(): void {
        if (!IsServer()) return;

        const parent = this.GetParent();
        const caster = this.GetCaster();
        const ability = this.GetAbility();

        if (!parent.IsAlive()) {
            this.Destroy();
            return;
        }

        if (this.damage_pool <= 1) {
            print(`[modifier_warrior_deep_wound_debuff] Damage pool depleted`);
            this.Destroy();
            return;
        }

        const damage_this_tick = this.damage_pool * this.pool_drain_rate;
        this.damage_pool -= damage_this_tick;

        ApplyDamage({
            victim: parent,
            attacker: caster,
            damage: damage_this_tick,
            damage_type: DamageTypes.PHYSICAL,
            ability: ability,
        });

        const dps = damage_this_tick / this.tick_rate;

        print(`[modifier_warrior_deep_wound_debuff] Dealt ${damage_this_tick.toFixed(1)} damage (${dps.toFixed(1)} DPS), Pool: ${this.damage_pool.toFixed(1)}`);
    }
    
    OnDestroy(): void {
        if (!IsServer()) return;
        
        const parent = this.GetParent();
        parent.StopSound("Hero_Bloodseeker.Rupture");
    }

    // 🔧 不使用粒子特效，只用音效
    GetTexture(): string {
        return "bloodseeker_rupture";
    }

    OnTooltip(): number {
        return this.damage_pool;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOOLTIP];
    }
}