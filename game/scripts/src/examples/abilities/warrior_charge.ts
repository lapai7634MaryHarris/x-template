import {
  BaseAbility,
  BaseModifierMotionHorizontal,
  registerAbility,
  registerModifier,
} from "../../utils/dota_ts_adapter";
import { RageSystem } from "../../modules/rage_system";

@registerAbility()
export class charge extends BaseAbility {
  OnSpellStart(): void {
    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    const target = this.GetCursorTarget() as CDOTA_BaseNPC;
    
    if (!target) {
      print("[charge] No target!");
      return;
    }
    
    if (target.TriggerSpellAbsorb(this)) {
      print("[charge] Spell absorbed!");
      return;
    }

    const start_pos = caster.GetAbsOrigin();
    const speed = this.GetSpecialValueFor("speed") || 1200;
    const collision_radius = this.GetSpecialValueFor("collision_radius") || 150;
    const base_damage = this.GetSpecialValueFor("base_damage") || 120;
    const max_damage = this.GetSpecialValueFor("max_damage") || 300;
    const rage_gain = this.GetSpecialValueFor("rage_gain") || 20;
    const stun_duration = this.GetSpecialValueFor("stun_duration") || 1.0;
    const max_duration = this.GetSpecialValueFor("max_duration") || 5.0;

    print(`[charge] ${caster.GetUnitName()} charging at ${target.GetUnitName()}`);

    caster.AddNewModifier(caster, this, "modifier_charge", {
      target_entindex: target.entindex(),
      speed: speed,
      collision_radius: collision_radius,
      base_damage: base_damage,
      max_damage: max_damage,
      rage_gain: rage_gain,
      startvec_x: start_pos.x,
      startvec_y: start_pos.y,
      startvec_z: start_pos.z,
      stun_duration: stun_duration,
      max_duration: max_duration
    });

    caster.EmitSound("Hero_Spirit_Breaker.Charge.Start");
    
    // 🔧 手动触发冷却（MaxLevel=1 的技能需要这样）
    this.UseResources(false, false, false, true);
  }
}

@registerModifier()
export class modifier_charge extends BaseModifierMotionHorizontal {
  caster!: CDOTA_BaseNPC_Hero;
  target!: CDOTA_BaseNPC;
  speed: number = 1200;
  collision_radius: number = 150;
  base_damage: number = 120;
  max_damage: number = 300;
  rage_gain: number = 20;
  stun_duration: number = 1.0;
  max_duration: number = 5.0;
  startvec!: Vector;
  charging: boolean = false;
  arrived: boolean = false;

  IsHidden(): boolean { return false; }
  IsPurgable(): boolean { return false; }
  GetEffectName(): string { return "particles/units/heroes/hero_spirit_breaker/spirit_breaker_charge.vpcf"; }
  GetEffectAttachType(): ParticleAttachment { return ParticleAttachment.ABSORIGIN_FOLLOW; }

  OnCreated(params: any): void {
    if (!IsServer()) return;

    this.caster = this.GetParent() as CDOTA_BaseNPC_Hero;
    this.target = EntIndexToHScript(params.target_entindex) as CDOTA_BaseNPC;
    this.speed = Number(params.speed) || 1200;
    this.collision_radius = Number(params.collision_radius) || 150;
    this.base_damage = Number(params.base_damage) || 120;
    this.max_damage = Number(params.max_damage) || 300;
    this.rage_gain = Number(params.rage_gain) || 20;
    this.stun_duration = Number(params.stun_duration) || 1.0;
    this.max_duration = Number(params.max_duration) || 5.0;

    this.startvec = Vector(
      Number(params.startvec_x) || 0,
      Number(params.startvec_y) || 0,
      Number(params.startvec_z) || 0
    );

    this.charging = true;
    this.arrived = false;

    if (!this.ApplyHorizontalMotionController()) {
      print("[modifier_charge] Failed to apply motion controller!");
      this.Destroy();
      return;
    }

    // 每 0.03 秒检查一次碰撞
    this.StartIntervalThink(0.03);
    
    this.caster.StartGesture(GameActivity.DOTA_RUN);
    print(`[modifier_charge] Started charging (collision_radius: ${this.collision_radius})`);
  }

  UpdateHorizontalMotion(unit: CDOTA_BaseNPC, dt: number): void {
    if (!IsServer() || !this.charging || this.arrived) return;

    if (!this.target || !this.target.IsAlive()) {
      print("[modifier_charge] Target invalid or dead, ending charge");
      this.Destroy();
      return;
    }

    const myPos = unit.GetAbsOrigin();
    const tgtPos = this.target.GetAbsOrigin();
    const direction = (tgtPos.__sub(myPos) as Vector).Normalized();

    // 🔧 计算移动距离
    const moveDistance = this.speed * dt;
    const move = direction.__mul(moveDistance) as Vector;
    const newPos = myPos.__add(move) as Vector;

    unit.SetAbsOrigin(newPos);
    unit.FaceTowards(tgtPos);
  }

  OnIntervalThink(): void {
    if (!IsServer() || !this.charging || this.arrived) return;

    // 🔧 检查是否超时
    if (this.GetElapsedTime() >= this.max_duration) {
      print("[modifier_charge] Max duration reached, ending charge");
      this.Destroy();
      return;
    }

    // 🔧 检查碰撞（使用双方的碰撞半径）
    if (!this.target || !this.target.IsAlive()) {
      this.Destroy();
      return;
    }

    const myPos = this.caster.GetAbsOrigin();
    const tgtPos = this.target.GetAbsOrigin();
    const dist = (myPos.__sub(tgtPos) as Vector).Length2D();

    // 🔧 计算总碰撞半径（双方的碰撞半径 + 额外安全距离）
    const casterRadius = this.caster.GetPaddedCollisionRadius();
    const targetRadius = this.target.GetPaddedCollisionRadius();
    const totalRadius = casterRadius + targetRadius + this.collision_radius;

    print(`[modifier_charge] Distance: ${dist.toFixed(0)}, Required: ${totalRadius.toFixed(0)}`);

    if (dist <= totalRadius) {
      print(`[modifier_charge] ✓ Collision detected!`);
      this.OnArrival();
    }
  }

  OnArrival(): void {
    if (!IsServer() || this.arrived) return;
    this.arrived = true;

    print("[modifier_charge] Arrived at target!");

    if (!this.target || !this.target.IsAlive()) {
      this.Destroy();
      return;
    }

    this.caster.FadeGesture(GameActivity.DOTA_RUN);
    this.caster.EmitSound("Hero_Spirit_Breaker.Charge.Impact");

    // 🔧 基于距离计算伤害
    const initial_dist = (this.startvec.__sub(this.target.GetAbsOrigin()) as Vector).Length2D();
    const max_possible = 3000;
    let percent = initial_dist / max_possible;
    percent = Math.min(1, Math.max(0, percent));
    const damage = this.base_damage + (this.max_damage - this.base_damage) * percent;

    print(`[modifier_charge] Distance: ${initial_dist.toFixed(0)}, Damage: ${damage.toFixed(0)} (${(percent * 100).toFixed(0)}%)`);

    // 🔧 眩晕
    this.target.AddNewModifier(
      this.caster,
      this.GetAbility(),
      "modifier_stunned",
      { duration: this.stun_duration }
    );

    // 🔧 造成伤害
    ApplyDamage({
      victim: this.target,
      attacker: this.caster,
      damage: damage,
      damage_type: DamageTypes.PHYSICAL,
      ability: this.GetAbility(),
    });

    // 🔧 增加怒气
    RageSystem.AddRage(this.caster, this.rage_gain);
    print(`[modifier_charge] ✓ Gained ${this.rage_gain} rage`);

    // 🔧 粒子效果
    const particle = ParticleManager.CreateParticle(
      "particles/units/heroes/hero_spirit_breaker/spirit_breaker_charge_impact.vpcf",
      ParticleAttachment.ABSORIGIN,
      this.target
    );
    ParticleManager.SetParticleControl(particle, 0, this.target.GetAbsOrigin());
    ParticleManager.ReleaseParticleIndex(particle);

    // 🔧 屏幕震动
    ScreenShake(this.target.GetAbsOrigin(), 100, 150, 0.5, 500, 0, true);

    this.charging = false;
    this.Destroy();
  }

  OnDestroy(): void {
    if (!IsServer()) return;

    print("[modifier_charge] Destroyed");
    this.charging = false;
    this.caster.RemoveHorizontalMotionController(this);
    this.caster.FadeGesture(GameActivity.DOTA_RUN);
    this.caster.StopSound("Hero_Spirit_Breaker.Charge.Start");
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.OVERRIDE_ANIMATION];
  }

  GetOverrideAnimation(): GameActivity {
    return GameActivity.DOTA_RUN;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.NO_UNIT_COLLISION]: true,
      [ModifierState.FLYING_FOR_PATHING_PURPOSES_ONLY]: true,
    };
  }
}