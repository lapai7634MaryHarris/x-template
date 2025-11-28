/**
 * 怪物词条系统
 * 精英怪：1-6个词条
 * Boss：2-4个词条
 * 词条越多，掉落越好
 */

// ==================== 词条定义 ====================

export enum AffixType {
    // 基础属性词条
    TOUGH = "tough",              // 坚韧：+50%生命
    MIGHTY = "mighty",            // 强壮：+100%生命
    FURIOUS = "furious",          // 狂暴：+30%攻击
    BRUTAL = "brutal",            // 凶残：+60%攻击
    SWIFT = "swift",              // 迅捷：+40%移速攻速
    GIANT = "giant",              // 巨型：体型变大，+200%生命，+50%攻击
    
    // 特殊能力词条
    VAMPIRIC = "vampiric",        // 吸血：攻击回复10%生命
    THORNS = "thorns",            // 反伤：反弹15%伤害
    SPLITTING = "splitting",      // 分裂：死亡分裂成2只小怪
    SHIELDED = "shielded",        // 护盾：每10秒获得护盾
    SUMMONER = "summoner",        // 召唤：每15秒召唤小怪
    UNDYING = "undying",          // 不屈：首次致死回复50%生命
    ENRAGED = "enraged",          // 狂暴化：低血量攻击翻倍
    FROZEN_AURA = "frozen_aura",  // 冰霜光环：减速周围玩家
    BURNING_AURA = "burning_aura", // 燃烧光环：灼烧周围玩家
}

// 词条配置
export interface AffixConfig {
    name: string;           // 显示名称
    description: string;    // 描述
    color: string;          // 颜色（用于显示）
    forElite: boolean;      // 精英怪可用
    forBoss: boolean;       // Boss可用
    
    // 属性修改
    healthMult?: number;    // 生命倍率
    damageMult?: number;    // 攻击倍率
    speedMult?: number;     // 移速倍率
    attackSpeedMult?: number; // 攻速倍率
    scaleMult?: number;     // 体型倍率
    
    // 特殊效果标记
    hasSpecialEffect?: boolean;
}

// 词条配置表
export const AFFIX_CONFIG: Record<AffixType, AffixConfig> = {
    // ===== 基础属性词条 =====
    [AffixType. TOUGH]: {
        name: "坚韧",
        description: "+50%生命值",
        color: "#00FF00",
        forElite: true,
        forBoss: true,
        healthMult: 1.5,
    },
    [AffixType. MIGHTY]: {
        name: "强壮",
        description: "+100%生命值",
        color: "#00AA00",
        forElite: true,
        forBoss: true,
        healthMult: 2.0,
    },
    [AffixType. FURIOUS]: {
        name: "狂暴",
        description: "+30%攻击力",
        color: "#FF6600",
        forElite: true,
        forBoss: true,
        damageMult: 1.3,
    },
    [AffixType.BRUTAL]: {
        name: "凶残",
        description: "+60%攻击力",
        color: "#FF0000",
        forElite: true,
        forBoss: true,
        damageMult: 1.6,
    },
    [AffixType.SWIFT]: {
        name: "迅捷",
        description: "+40%移速和攻速",
        color: "#00FFFF",
        forElite: true,
        forBoss: true,
        speedMult: 1.4,
        attackSpeedMult: 1.4,
    },
    [AffixType.GIANT]: {
        name: "巨型",
        description: "体型变大，+200%生命，+50%攻击",
        color: "#AA00AA",
        forElite: false,
        forBoss: true,
        healthMult: 3.0,
        damageMult: 1.5,
        scaleMult: 1.5,
    },
    
    // ===== 特殊能力词条 =====
    [AffixType.VAMPIRIC]: {
        name: "吸血",
        description: "攻击回复10%伤害的生命",
        color: "#FF0066",
        forElite: true,
        forBoss: true,
        hasSpecialEffect: true,
    },
    [AffixType.THORNS]: {
        name: "反伤",
        description: "受击时反弹15%伤害",
        color: "#996633",
        forElite: true,
        forBoss: true,
        hasSpecialEffect: true,
    },
    [AffixType.SPLITTING]: {
        name: "分裂",
        description: "死亡时分裂成2只小怪",
        color: "#66FF66",
        forElite: true,
        forBoss: false,
        hasSpecialEffect: true,
    },
    [AffixType.SHIELDED]: {
        name: "护盾",
        description: "每10秒获得吸收伤害的护盾",
        color: "#6699FF",
        forElite: false,
        forBoss: true,
        hasSpecialEffect: true,
    },
    [AffixType.SUMMONER]: {
        name: "召唤",
        description: "每15秒召唤2只小怪",
        color: "#9966FF",
        forElite: false,
        forBoss: true,
        hasSpecialEffect: true,
    },
    [AffixType.UNDYING]: {
        name: "不屈",
        description: "第一次致死时回复50%生命",
        color: "#FFFF00",
        forElite: false,
        forBoss: true,
        hasSpecialEffect: true,
    },
    [AffixType. ENRAGED]: {
        name: "狂暴化",
        description: "生命低于30%时攻击翻倍",
        color: "#FF3300",
        forElite: false,
        forBoss: true,
        hasSpecialEffect: true,
    },
    [AffixType.FROZEN_AURA]: {
        name: "冰霜光环",
        description: "减慢周围玩家20%移速",
        color: "#99CCFF",
        forElite: true,
        forBoss: true,
        hasSpecialEffect: true,
    },
    [AffixType. BURNING_AURA]: {
        name: "燃烧光环",
        description: "每秒对周围玩家造成伤害",
        color: "#FF6600",
        forElite: true,
        forBoss: true,
        hasSpecialEffect: true,
    },
};

// ==================== 词条管理器 ====================

export class AffixSystem {
    
    // 存储怪物的词条和特殊效果计时器
    private static monsterAffixes: Map<number, AffixType[]> = new Map();
    private static monsterTimers: Map<number, string[]> = new Map();
    private static undyingTriggered: Set<number> = new Set();
    
    /**
     * 为怪物生成随机词条
     */
    public static GenerateAffixes(monsterType: "elite" | "boss"): AffixType[] {
        const affixes: AffixType[] = [];
        
        // 确定词条数量
        let count: number;
        if (monsterType === "elite") {
            count = RandomInt(1, 6);
        } else {
            count = RandomInt(2, 4);
        }
        
        // 获取可用词条池
        const availableAffixes = Object.entries(AFFIX_CONFIG)
            . filter(([_, config]) => {
                if (monsterType === "elite") return config.forElite;
                if (monsterType === "boss") return config.forBoss;
                return false;
            })
            .map(([type, _]) => type as AffixType);
        
        // 随机选择词条（不重复）
        const shuffled = [...availableAffixes];
        for (let i = 0; i < count && shuffled.length > 0; i++) {
            const randomIndex = RandomInt(0, shuffled.length - 1);
            affixes.push(shuffled[randomIndex]);
            shuffled.splice(randomIndex, 1);
        }
        
        return affixes;
    }
    

/**
 * 应用词条到怪物
 */
public static ApplyAffixes(monster: CDOTA_BaseNPC, affixes: AffixType[]): void {
    const entityIndex = monster.GetEntityIndex();
    this.monsterAffixes. set(entityIndex, affixes);
    this.monsterTimers.set(entityIndex, []);
    
    // 计算词条总倍率
    let healthMult = 1.0;
    let damageMult = 1.0;
    let speedMult = 1.0;
    let extraScale = 1.0;
    
    for (const affix of affixes) {
        const config = AFFIX_CONFIG[affix];
        
        if (config. healthMult) healthMult *= config. healthMult;
        if (config. damageMult) damageMult *= config.damageMult;
        if (config.speedMult) speedMult *= config.speedMult;
        if (config.scaleMult) extraScale *= config.scaleMult;
    }
    
    // 🔧 延迟应用，确保单位完全初始化
    Timers.CreateTimer(0.2, () => {
        if (!IsValidEntity(monster)) return undefined;
        
        const isHero = monster. IsHero();
        
        // === 生命值 ===
        if (isHero) {
            // 🔧 英雄单位：通过力量属性增加生命
            // 每点力量 = 22生命值
            const hero = monster as CDOTA_BaseNPC_Hero;
            const currentHealth = hero.GetMaxHealth();
            const targetHealth = Math.floor(currentHealth * healthMult);
            const healthDiff = targetHealth - currentHealth;
            const strNeeded = Math.floor(healthDiff / 22);
            
            if (strNeeded > 0) {
                hero.ModifyStrength(strNeeded);
            }
            
            // 设置满血
            Timers.CreateTimer(0.1, () => {
                if (IsValidEntity(hero)) {
                    hero.SetHealth(hero.GetMaxHealth());
                }
                return undefined;
            });
        } else {
            // 普通单位：直接设置
            const currentMaxHealth = monster.GetMaxHealth();
            const newHealth = Math.floor(currentMaxHealth * healthMult);
            monster.SetBaseMaxHealth(newHealth);
            monster. SetMaxHealth(newHealth);
            monster.SetHealth(newHealth);
        }
        
        // === 攻击力 ===
        if (isHero) {
            // 🔧 英雄单位：通过主属性增加攻击
            const hero = monster as CDOTA_BaseNPC_Hero;
            const currentDamage = hero.GetBaseDamageMax();
            const targetDamage = Math.floor(currentDamage * damageMult);
            const damageDiff = targetDamage - currentDamage;
            
            // 加敏捷来增加攻击（通用）
            if (damageDiff > 0) {
                hero.ModifyAgility(damageDiff);
            }
        } else {
            const baseDamageMin = monster.GetBaseDamageMin();
            const baseDamageMax = monster.GetBaseDamageMax();
            monster.SetBaseDamageMin(Math. floor(baseDamageMin * damageMult));
            monster.SetBaseDamageMax(Math.floor(baseDamageMax * damageMult));
        }
        
        // === 移速 ===
        const baseSpeed = monster.GetBaseMoveSpeed();
        monster.SetBaseMoveSpeed(Math.floor(baseSpeed * speedMult));
        
        // === 体型（词条额外缩放）===
        if (extraScale !== 1.0) {
            const currentScale = monster.GetModelScale();
            monster.SetModelScale(currentScale * extraScale);
        }
        
        // 🔧 打印最终属性验证
        Timers.CreateTimer(0.2, () => {
            if (IsValidEntity(monster)) {
                print(`[AffixSystem] ✅ 最终验证: 生命=${monster. GetHealth()}/${monster.GetMaxHealth()}, 移速=${monster.GetBaseMoveSpeed()}, 体型=${monster.GetModelScale(). toFixed(2)}`);
            }
            return undefined;
        });
        
        return undefined;
    });
    
    // 应用特殊效果
    this.ApplySpecialEffects(monster, affixes);
    
    // 添加视觉效果
    this.ApplyVisualEffects(monster, affixes);
    
    print(`[AffixSystem] 应用词条: ${this.GetAffixNames(affixes). join(", ")} (生命x${healthMult}, 攻击x${damageMult}, 移速x${speedMult})`);
}
    
/**
 * 应用特殊效果
 */
private static ApplySpecialEffects(monster: CDOTA_BaseNPC, affixes: AffixType[]): void {
    const entityIndex = monster.GetEntityIndex();
    const timers: string[] = [];
    
    for (const affix of affixes) {
        switch (affix) {
            case AffixType. SHIELDED:
                // 护盾：每10秒获得临时生命
                const shieldTimer = Timers.CreateTimer(0, () => {
                    if (! IsValidEntity(monster) || !monster. IsAlive()) return undefined;
                    
                    // 🔧 简单实现：直接回复生命
                    const shieldAmount = Math.floor(monster.GetMaxHealth() * 0.2);
                    monster.SetHealth(Math.min(monster.GetHealth() + shieldAmount, monster.GetMaxHealth()));
                    
                    // 护盾特效
                    const particle = ParticleManager.CreateParticle(
                        "particles/items_fx/black_king_bar_avatar.vpcf",
                        ParticleAttachment. ABSORIGIN_FOLLOW,
                        monster
                    );
                    
                    Timers.CreateTimer(3, () => {
                        ParticleManager.DestroyParticle(particle, false);
                        ParticleManager.ReleaseParticleIndex(particle);
                        return undefined;
                    });
                    
                    print(`[AffixSystem] 护盾触发！回复 ${shieldAmount} 生命`);
                    return 10.0;  // 每10秒
                });
                timers.push(shieldTimer);
                break;
                
            case AffixType.SUMMONER:
                // 召唤：每15秒召唤小怪
                const summonTimer = Timers.CreateTimer(5, () => {
                    if (!IsValidEntity(monster) || !monster.IsAlive()) return undefined;
                    
                    const pos = monster.GetAbsOrigin();
                    for (let i = 0; i < 2; i++) {
                        const offsetX = RandomFloat(-200, 200);
                        const offsetY = RandomFloat(-200, 200);
                        const spawnPos = Vector(pos.x + offsetX, pos.y + offsetY, pos.z);
                        
                        const minion = CreateUnitByName(
                            "npc_dota_creep_badguys_melee",
                            spawnPos,
                            true,
                            undefined,
                            undefined,
                            DotaTeam.BADGUYS
                        );
                        
                        if (minion) {
                            minion.SetBaseMaxHealth(Math.floor(minion.GetMaxHealth() * 0.5));
                            minion.SetHealth(minion.GetMaxHealth());
                            (minion as any). isSummonedMinion = true;
                            (minion as any). zoneMonsterType = "normal";
                        }
                    }
                    
                    // 召唤特效
                    const particle = ParticleManager. CreateParticle(
                        "particles/units/heroes/hero_enigma/enigma_demonic_conversion.vpcf",
                        ParticleAttachment. ABSORIGIN,
                        monster
                    );
                    ParticleManager.SetParticleControl(particle, 0, pos);
                    ParticleManager.ReleaseParticleIndex(particle);
                    
                    print(`[AffixSystem] 召唤触发！生成2只小怪`);
                    return 15.0;  // 每15秒
                });
                timers. push(summonTimer);
                break;
                
            case AffixType. FROZEN_AURA:
    // 冰霜光环：减速周围玩家
    const frozenTimer = Timers.CreateTimer(0, () => {
        if (! IsValidEntity(monster) || ! monster.IsAlive()) return undefined;
        
        const pos = monster.GetAbsOrigin();
        const enemies = FindUnitsInRadius(
            DotaTeam.BADGUYS,
            pos,
            undefined,
            600,  // 🔧 范围从500增加到600
            UnitTargetTeam.ENEMY,
            UnitTargetType. HERO,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );
        
        for (const enemy of enemies) {
            // 🔧 直接修改移速
            if (!(enemy as any).isFrozenSlowed) {
                (enemy as any). isFrozenSlowed = true;
                const originalSpeed = enemy.GetBaseMoveSpeed();
                const slowedSpeed = Math.floor(originalSpeed * 0.6);  // 🔧 减速40%（原来20%）
                enemy.SetBaseMoveSpeed(slowedSpeed);
                
                // 🔧 添加冰冻特效到玩家身上
                const frostEffect = ParticleManager.CreateParticle(
                    "particles/generic_gameplay/generic_slowed_cold.vpcf",
                    ParticleAttachment. ABSORIGIN_FOLLOW,
                    enemy
                );
                
                print(`[AffixSystem] ❄️ 冰霜光环: ${enemy.GetUnitName()} 被减速 (${originalSpeed} -> ${slowedSpeed})`);
                
                Timers.CreateTimer(2.0, () => {  // 🔧 持续2秒
                    if (IsValidEntity(enemy)) {
                        enemy.SetBaseMoveSpeed(originalSpeed);
                        (enemy as any).isFrozenSlowed = false;
                        ParticleManager.DestroyParticle(frostEffect, false);
                        ParticleManager.ReleaseParticleIndex(frostEffect);
                    }
                    return undefined;
                });
            }
        }
        
        return 1.0;
    });
    timers.push(frozenTimer);
    
    // 添加冰霜光环特效到怪物身上
    const frozenParticle = ParticleManager.CreateParticle(
        "particles/units/heroes/hero_crystalmaiden/maiden_freezing_field_snow.vpcf",
        ParticleAttachment.ABSORIGIN_FOLLOW,
        monster
    );
    (monster as any).frozenAuraParticle = frozenParticle;
    print(`[AffixSystem] ❄️ 冰霜光环已激活`);
    break;
    
case AffixType.BURNING_AURA:
    // 燃烧光环：持续灼烧周围玩家
    const burnTimer = Timers.CreateTimer(0, () => {
        if (!IsValidEntity(monster) || !monster.IsAlive()) return undefined;
        
        const pos = monster.GetAbsOrigin();
        const enemies = FindUnitsInRadius(
            DotaTeam.BADGUYS,
            pos,
            undefined,
            500,  // 🔧 范围500
            UnitTargetTeam. ENEMY,
            UnitTargetType. HERO,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );
        
        for (const enemy of enemies) {
            // 🔧 伤害提高到50
            const damage = 50;
            ApplyDamage({
                victim: enemy,
                attacker: monster,
                damage: damage,
                damage_type: DamageTypes.MAGICAL,
            });
            
            // 🔧 添加燃烧特效
            const burnEffect = ParticleManager. CreateParticle(
                "particles/units/heroes/hero_huskar/huskar_burning_spear_debuff.vpcf",
                ParticleAttachment. ABSORIGIN_FOLLOW,
                enemy
            );
            
            Timers.CreateTimer(0.5, () => {
                ParticleManager.DestroyParticle(burnEffect, false);
                ParticleManager.ReleaseParticleIndex(burnEffect);
                return undefined;
            });
            
            print(`[AffixSystem] 🔥 燃烧光环: ${enemy. GetUnitName()} 受到 ${damage} 点伤害`);
        }
        
        return 1.0;
    });
    timers.push(burnTimer);
    
    // 添加燃烧光环特效到怪物身上
    const burnParticle = ParticleManager.CreateParticle(
        "particles/units/heroes/hero_ember_spirit/ember_spirit_flameguard.vpcf",
        ParticleAttachment. ABSORIGIN_FOLLOW,
        monster
    );
    (monster as any).burnAuraParticle = burnParticle;
    print(`[AffixSystem] 🔥 燃烧光环已激活`);
    break;
                
            case AffixType. ENRAGED:
                // 狂暴化：低血量攻击翻倍
                const enrageTimer = Timers.CreateTimer(0, () => {
                    if (! IsValidEntity(monster) || !monster. IsAlive()) return undefined;
                    
                    const healthPct = monster.GetHealth() / monster.GetMaxHealth();
                    const isEnraged = (monster as any).isEnraged;
                    
                    if (healthPct < 0.3 && !isEnraged) {
                        (monster as any).isEnraged = true;
                        
                        const currentDamage = monster.GetBaseDamageMax();
                        monster.SetBaseDamageMin(currentDamage * 2);
                        monster.SetBaseDamageMax(currentDamage * 2);
                        
                        // 狂暴特效
                        const particle = ParticleManager.CreateParticle(
                            "particles/units/heroes/hero_huskar/huskar_berserkers_blood.vpcf",
                            ParticleAttachment. ABSORIGIN_FOLLOW,
                            monster
                        );
                        (monster as any).enrageParticle = particle;
                        
                        print(`[AffixSystem] 狂暴化触发！攻击翻倍`);
                    }
                    
                    return 0.5;
                });
                timers.push(enrageTimer);
                break;
                
            case AffixType.VAMPIRIC:
                // 🔧 吸血：监听怪物造成的伤害
                // 需要在 zone_dungeon 中处理
                print(`[AffixSystem] 吸血词条已激活`);
                break;
                
            case AffixType.THORNS:
                // 🔧 反伤：监听怪物受到的伤害
                // 需要在 zone_dungeon 中处理
                print(`[AffixSystem] 反伤词条已激活`);
                break;
        }
    }
    
    this.monsterTimers.set(entityIndex, timers);
}
    
    /**
     * 添加视觉效果
     */
    private static ApplyVisualEffects(monster: CDOTA_BaseNPC, affixes: AffixType[]): void {
        // 根据词条数量选择特效颜色
        const affixCount = affixes.length;
        let particlePath: string;
        
        if (affixCount >= 5) {
            // 5+词条：金色特效
            particlePath = "particles/econ/events/ti10/portal/portal_open_good.vpcf";
        } else if (affixCount >= 3) {
            // 3-4词条：紫色特效
            particlePath = "particles/items2_fx/smoke_of_deceit_buff.vpcf";
        } else {
            // 1-2词条：普通特效
            particlePath = "particles/generic_gameplay/generic_buff.vpcf";
        }
        
        const particle = ParticleManager.CreateParticle(
            particlePath,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            monster
        );
        ParticleManager.SetParticleControl(particle, 0, monster.GetAbsOrigin());
        
        // 存储特效索引以便清理
        (monster as any).affixParticle = particle;
    }
    
    /**
     * 处理怪物死亡
     */
    public static OnMonsterDeath(monster: CDOTA_BaseNPC): AffixType[] | undefined {
        const entityIndex = monster. GetEntityIndex();
        const affixes = this.monsterAffixes. get(entityIndex);
        
        if (!affixes) return undefined;
        
        // 清理计时器
        const timers = this. monsterTimers. get(entityIndex);
        if (timers) {
            for (const timer of timers) {
                Timers. RemoveTimer(timer);
            }
        }
        
        // 清理特效
        const particle = (monster as any).affixParticle;
        if (particle) {
            ParticleManager.DestroyParticle(particle, false);
            ParticleManager.ReleaseParticleIndex(particle);
        }
        
        // 处理分裂词条
        if (affixes.includes(AffixType.SPLITTING)) {
            this.HandleSplitting(monster);
        }
        
        // 清理数据
        this. monsterAffixes.delete(entityIndex);
        this. monsterTimers. delete(entityIndex);
        this.undyingTriggered.delete(entityIndex);
        
        return affixes;
    }
    
    /**
     * 处理不屈词条（在伤害时调用）
     */
    public static HandleUndying(monster: CDOTA_BaseNPC, damage: number): boolean {
        const entityIndex = monster.GetEntityIndex();
        const affixes = this.monsterAffixes.get(entityIndex);
        
        if (!affixes || !affixes.includes(AffixType. UNDYING)) return false;
        if (this.undyingTriggered.has(entityIndex)) return false;
        
        // 检查是否会致死
        if (monster.GetHealth() - damage <= 0) {
            this. undyingTriggered.add(entityIndex);
            
            // 回复50%生命
            const healAmount = Math.floor(monster. GetMaxHealth() * 0.5);
            monster.SetHealth(healAmount);
            
            // 不屈特效
            const particle = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_skeleton_king/skeleton_king_reincarnate.vpcf",
                ParticleAttachment.ABSORIGIN,
                monster
            );
            ParticleManager.SetParticleControl(particle, 0, monster.GetAbsOrigin());
            ParticleManager.ReleaseParticleIndex(particle);
            
            print(`[AffixSystem] 不屈触发！回复 ${healAmount} 生命`);
            return true;  // 阻止死亡
        }
        
        return false;
    }
    
    /**
     * 处理分裂词条
     */
    private static HandleSplitting(monster: CDOTA_BaseNPC): void {
        const pos = monster.GetAbsOrigin();
        
        for (let i = 0; i < 2; i++) {
            const offsetX = RandomFloat(-150, 150);
            const offsetY = RandomFloat(-150, 150);
            const spawnPos = Vector(pos.x + offsetX, pos.y + offsetY, pos.z);
            
            const splitling = CreateUnitByName(
                "npc_dota_creep_badguys_melee",
                spawnPos,
                true,
                undefined,
                undefined,
                DotaTeam.BADGUYS
            );
            
            if (splitling) {
                // 分裂物较小较弱
                splitling.SetModelScale(0.7);
                splitling.SetBaseMaxHealth(Math.floor(monster.GetMaxHealth() * 0.3));
                splitling.SetHealth(splitling.GetMaxHealth());
                
                // 标记为分裂物
                (splitling as any).isSplitling = true;
                (splitling as any). zoneMonsterType = "normal";  // 算作普通怪
            }
        }
        
        // 分裂特效
        const particle = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_broodmother/broodmother_spiderlings_spawn.vpcf",
            ParticleAttachment. ABSORIGIN,
            monster
        );
        ParticleManager.SetParticleControl(particle, 0, pos);
        ParticleManager.ReleaseParticleIndex(particle);
        
        print(`[AffixSystem] 分裂！生成2只小怪`);
    }
    
    /**
     * 处理吸血词条
     */
    public static HandleVampiric(monster: CDOTA_BaseNPC, damage: number): void {
        const entityIndex = monster.GetEntityIndex();
        const affixes = this.monsterAffixes.get(entityIndex);
        
        if (!affixes || !affixes. includes(AffixType.VAMPIRIC)) return;
        
        // 回复10%伤害的生命
        const healAmount = Math. floor(damage * 0.1);
        monster. SetHealth(Math.min(monster.GetHealth() + healAmount, monster.GetMaxHealth()));
    }
    
    /**
     * 处理反伤词条
     */
    public static HandleThorns(monster: CDOTA_BaseNPC, attacker: CDOTA_BaseNPC, damage: number): void {
        const entityIndex = monster.GetEntityIndex();
        const affixes = this.monsterAffixes.get(entityIndex);
        
        if (!affixes || !affixes. includes(AffixType.THORNS)) return;
        if (! IsValidEntity(attacker) || !attacker.IsAlive()) return;
        
        // 反弹15%伤害
        const thornDamage = Math.floor(damage * 0.15);
        ApplyDamage({
            victim: attacker,
            attacker: monster,
            damage: thornDamage,
            damage_type: DamageTypes. PURE,
        });
    }
    
    /**
     * 获取怪物的词条
     */
    public static GetAffixes(monster: CDOTA_BaseNPC): AffixType[] | undefined {
        return this.monsterAffixes.get(monster.GetEntityIndex());
    }
    
    /**
     * 获取词条显示名称
     */
    public static GetAffixNames(affixes: AffixType[]): string[] {
        return affixes.map(affix => AFFIX_CONFIG[affix].name);
    }
    
    /**
     * 获取词条显示文本（带颜色）
     */
    public static GetAffixDisplayText(affixes: AffixType[]): string {
        return affixes.map(affix => {
            const config = AFFIX_CONFIG[affix];
            return `<font color='${config.color}'>[${config.name}]</font>`;
        }).join("");
    }
    
    /**
     * 计算掉落加成（每个词条+20%）
     */
    public static GetDropBonus(affixes: AffixType[]): number {
        return 1.0 + (affixes.length * 0.2);
    }
}