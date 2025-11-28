/**
 * 刷怪区域副本系统 - 主类
 * 对应传送门菜单的"副本B"
 */
import { AffixSystem, AffixType, AFFIX_CONFIG } from "./zone_affix";
import {
    ZONE_CONFIG,
    ZONE_AREA,
    ZONE_BOUNDS,
    ZONE_ENTRANCE,
    TOWN_SPAWN,
    SPAWN_POINTS,
    PARTY_SCALING,
    MONSTER_SCORE,
} from "./zone_config";
import { ZoneLootSystem,LOOT_ITEMS } from "./zone_loot";
interface ZonePlayer {
    playerId: PlayerID;
    hero: CDOTA_BaseNPC_Hero;
    isAlive: boolean;
    ticketAUsed: number;  // 投入的票A数量
}

export class ZoneDungeon {
    private isActive: boolean = false;
    private players: Map<PlayerID, ZonePlayer> = new Map();
    private monsters: CDOTA_BaseNPC[] = [];
    private teamScore: number = 0;
    private eliteThreshold: number = ZONE_CONFIG.ELITE_TRIGGER_SCORE;
    private bossThreshold: number = ZONE_CONFIG.BOSS_TRIGGER_SCORE;
    
    private startTime: number = 0;
    private spawnTimer: string | undefined;
    private mainTimer: string | undefined;
    
    constructor() {
        print("[ZoneDungeon] 初始化刷怪区域系统.. .");
        this. ListenToEvents();
        this.ListenToChatCommands();
    }
    
    // ==================== 事件监听 ====================
    
    private ListenToEvents(): void {
        // 监听怪物死亡
        ListenToGameEvent("entity_killed", (event) => {
            this.OnEntityKilled(event);
        }, this);
    }
    
    private ShowInventory(playerId: PlayerID): void {
    const inventory = ZoneLootSystem. GetInventory(playerId);
    
    if (inventory. size === 0) {
        GameRules.SendCustomMessage("<font color='#888888'>背包是空的</font>", playerId, 0);
        return;
    }
    
    GameRules.SendCustomMessage("<font color='#FFD700'>===== 背包 =====</font>", playerId, 0);
    
    inventory.forEach((count, itemType) => {
        const config = LOOT_ITEMS[itemType];
        GameRules.SendCustomMessage(
            `<font color='${config. color}'>${config. name}: ${count}</font>`,
            playerId,
            0
        );
    });
}
    private ListenToChatCommands(): void {
        ListenToGameEvent("player_chat", (event) => {
            const text = event.text. trim(). toLowerCase();
            const playerId = event.playerid as PlayerID;
            
            // 查看背包命令
           if (text === "-bag" || text === "-b") {
               this.ShowInventory(playerId);
           }
           
           
           // 测试掉落命令
           if (text === "-testdrop") {
               ZoneLootSystem. ProcessLoot("boss", [playerId], 2.0);
               GameRules.SendCustomMessage("<font color='#00FF00'>测试掉落已发放！</font>", playerId, 0);
           }
           

            // 测试命令：-zone 或 -z 进入刷怪区域
            if (text === "-zone" || text === "-z") {
                this.TryEnterZone(playerId, 0);
            }
            
            // 测试命令：-zone 3 投入3张票A
            if (text. startsWith("-zone ")) {
                const ticketCount = parseInt(text. split(" ")[1]) || 0;
                this.TryEnterZone(playerId, ticketCount);
            }
            
            // 死亡后补票重进
            if (text === "-rejoin" || text === "-rj") {
                this.TryRejoin(playerId);
            }
        }, this);
        
    }
    
    // ==================== 公开接口（供传送门调用）====================
    
    /**
     * 从传送门菜单进入（副本B）
     * @param playerId 玩家ID
     * @param ticketACount 投入的票A数量
     */
    public EnterFromPortal(playerId: PlayerID, ticketACount: number = 0): void {
        this.TryEnterZone(playerId, ticketACount);
    }
    
    /**
     * 检查是否可以进入
     */
    public CanEnter(playerId: PlayerID): { canEnter: boolean; reason: string } {
        // TODO: 检查疲劳值
        // const fatigue = FatigueSystem.GetFatigue(playerId);
        // if (fatigue < ZONE_CONFIG. FATIGUE_COST) {
        //     return { canEnter: false, reason: "疲劳值不足" };
        // }
        
        // 检查是否已在副本中
        if (this.isActive && this.players. has(playerId)) {
            return { canEnter: false, reason: "你已经在刷怪区域中" };
        }
        
        // 检查人数上限
        if (this.isActive && this.players.size >= 4) {
            return { canEnter: false, reason: "副本已满（4人上限）" };
        }
        
        return { canEnter: true, reason: "" };
    }
    
    // ==================== 进入/退出逻辑 ====================
    
    public TryEnterZone(playerId: PlayerID, ticketACount: number): boolean {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) {
            print(`[ZoneDungeon] 玩家 ${playerId} 没有英雄`);
            return false;
        }
        
        const checkResult = this.CanEnter(playerId);
        if (! checkResult.canEnter) {
            GameRules.SendCustomMessage(
                `<font color='#FF0000'>❌ ${checkResult.reason}</font>`,
                playerId,
                0
            );
            return false;
        }
        
        // 如果副本未激活，创建新副本
        if (! this.isActive) {
            this. StartZone(playerId, hero, ticketACount);
        } else {
            // 加入现有副本
            this.JoinZone(playerId, hero, ticketACount);
        }
        
        return true;
    }
    
    private StartZone(playerId: PlayerID, hero: CDOTA_BaseNPC_Hero, ticketACount: number): void {
        print(`[ZoneDungeon] ========== 开始刷怪区域 ==========`);
        print(`[ZoneDungeon] 区域中心: ${ZONE_AREA.center}`);
        print(`[ZoneDungeon] 区域大小: ${ZONE_AREA.halfSize * 2} x ${ZONE_AREA.halfSize * 2}`);
        
        this.isActive = true;
        this. startTime = GameRules.GetGameTime();
        this.teamScore = 0;
        this.monsters = [];
        this.eliteThreshold = ZONE_CONFIG. ELITE_TRIGGER_SCORE;
        this.bossThreshold = ZONE_CONFIG.BOSS_TRIGGER_SCORE;
        
        // 添加玩家
        this.AddPlayer(playerId, hero, ticketACount);
        
        // 传送到区域
        this.TeleportToZone(hero);
        
        // 启动计时器
        this.StartTimers();
        
        // 立即刷第一波怪
        this.SpawnWave();
        
        // TODO: 消耗疲劳值
        // FatigueSystem.ConsumeFatigue(playerId, ZONE_CONFIG.FATIGUE_COST);
        
        GameRules.SendCustomMessage(
            `<font color='#00FF00'>⚔️ 进入刷怪区域！持续10分钟</font>`,
            playerId,
            0
        );
        
        if (ticketACount > 0) {
            GameRules.SendCustomMessage(
                `<font color='#FFD700'>🎫 投入 ${ticketACount} 张票A，获得 ${ticketACount} 个副本词条</font>`,
                playerId,
                0
            );
            // TODO: 应用副本词条效果
        }
    }
    
    private JoinZone(playerId: PlayerID, hero: CDOTA_BaseNPC_Hero, ticketACount: number): void {
        this.AddPlayer(playerId, hero, ticketACount);
        this.TeleportToZone(hero);
        this.UpdateMonsterScaling();
        
        // 通知所有玩家
        this.BroadcastMessage(`✅ 玩家加入！当前 ${this.players. size} 人`, "#00FF00");
        
        // TODO: 消耗疲劳值
    }
    
    private AddPlayer(playerId: PlayerID, hero: CDOTA_BaseNPC_Hero, ticketACount: number): void {
        this.players.set(playerId, {
            playerId,
            hero,
            isAlive: true,
            ticketAUsed: ticketACount,
        });
        print(`[ZoneDungeon] 玩家 ${playerId} 加入，当前 ${this. players.size} 人`);
    }
    
    private TeleportToZone(hero: CDOTA_BaseNPC_Hero): void {
        FindClearSpaceForUnit(hero, ZONE_ENTRANCE, true);
        print(`[ZoneDungeon] 传送到 ${ZONE_ENTRANCE}`);
    }
    
    private TryRejoin(playerId: PlayerID): void {
        if (! this.isActive) {
            GameRules.SendCustomMessage(
                `<font color='#FF0000'>❌ 当前没有进行中的副本</font>`,
                playerId,
                0
            );
            return;
        }
        
        const player = this.players. get(playerId);
        if (!player) {
            GameRules.SendCustomMessage(
                `<font color='#FF0000'>❌ 你不在这个副本中</font>`,
                playerId,
                0
            );
            return;
        }
        
        if (player.isAlive) {
            GameRules.SendCustomMessage(
                `<font color='#FF0000'>❌ 你还活着，不需要补票</font>`,
                playerId,
                0
            );
            return;
        }
        
        // TODO: 检查并消耗2倍票A
        const rejoinCost = player.ticketAUsed * 2;
        // if (! TicketSystem.HasTicketA(playerId, rejoinCost)) {
        //     GameRules.SendCustomMessage(`❌ 票A不足，需要 ${rejoinCost} 张`, playerId, 0);
        //     return;
        // }
        // TicketSystem.ConsumeTicketA(playerId, rejoinCost);
        
        // 复活并传送回区域
        player.isAlive = true;
        if (player.hero && IsValidEntity(player.hero)) {
            player.hero.RespawnHero(false, false);
            this.TeleportToZone(player.hero);
        }
        
        GameRules.SendCustomMessage(
            `<font color='#00FF00'>✅ 补票成功！已返回刷怪区域</font>`,
            playerId,
            0
        );
        
        this.BroadcastMessage(`🔄 玩家已补票归来！`, "#00FFFF");
    }
    
    // ==================== 计时器 ====================
    
    private StartTimers(): void {
        let elapsed = 0;
        
        // 主计时器：每秒检查
        this.mainTimer = Timers.CreateTimer(1.0, () => {
            if (! this.isActive) return undefined;
            
            elapsed++;
            const remaining = ZONE_CONFIG. DURATION - elapsed;
            
            // 难度递进提示
            if (elapsed === ZONE_CONFIG. DIFFICULTY_TIME_1) {
                this.BroadcastMessage(`⏰ 难度提升！怪物变强了！(${ZONE_CONFIG. DIFFICULTY_MULT_1}x)`, "#FFFF00");
            } else if (elapsed === ZONE_CONFIG.DIFFICULTY_TIME_2) {
                this.BroadcastMessage(`⏰ 难度提升！怪物变强了！(${ZONE_CONFIG. DIFFICULTY_MULT_2}x)`, "#FF6600");
            }
            
            // 每分钟提醒
            if (remaining > 0 && remaining % 60 === 0) {
                const minutes = Math.floor(remaining / 60);
                this.BroadcastMessage(`⏰ 剩余时间：${minutes}分钟`, "#FFFFFF");
            }
            
            // 最后30秒倒计时
            if (remaining <= 30 && remaining > 0) {
                this.BroadcastMessage(`⏰ ${remaining}秒后结束！`, "#FF0000");
            }
            
            // 时间到
            if (remaining <= 0) {
                this.EndZone();
                return undefined;
            }
            
            return 1.0;
        });
        
        // 刷怪计时器：每30秒
        this.spawnTimer = Timers.CreateTimer(ZONE_CONFIG. SPAWN_INTERVAL, () => {
            if (!this.isActive) return undefined;
            
            this.SpawnWave();
            
            return ZONE_CONFIG. SPAWN_INTERVAL;
        });
    }
    
    // ==================== 刷怪逻辑 ====================
    
    private SpawnWave(): void {
        // 清理无效怪物引用
        this. monsters = this.monsters.filter(m => IsValidEntity(m) && m.IsAlive());
        
        const currentCount = this.monsters. length;
        const spawnCount = Math.min(
            ZONE_CONFIG.MAX_MONSTERS - currentCount,
            RandomInt(10, 15)  // 每波刷10-15只
        );
        
        if (spawnCount <= 0) {
            print(`[ZoneDungeon] 怪物已满 (${currentCount}/${ZONE_CONFIG. MAX_MONSTERS})，跳过刷新`);
            return;
        }
        
        print(`[ZoneDungeon] 刷新 ${spawnCount} 只怪物 (当前: ${currentCount})`);
        
        // 分群刷新
        this.SpawnCluster(spawnCount);
    }
    
    private SpawnCluster(totalCount: number): void {
        // 随机选择2-3个刷怪点作为群落中心
        const clusterCount = RandomInt(2, 3);
        const selectedPoints = this.GetRandomSpawnPoints(clusterCount);
        
        let remaining = totalCount;
        
        for (let i = 0; i < selectedPoints.length && remaining > 0; i++) {
            const clusterCenter = selectedPoints[i];
            const clusterSize = i === selectedPoints.length - 1 
                ? remaining 
                : RandomInt(3, Math.min(8, remaining));
            
            for (let j = 0; j < clusterSize; j++) {
                // 在群落中心附近随机位置生成
                const offsetX = RandomFloat(-300, 300);
                const offsetY = RandomFloat(-300, 300);
                const spawnPos = Vector(
                    clusterCenter.x + offsetX,
                    clusterCenter.y + offsetY,
                    clusterCenter. z
                );
                
                this.SpawnMonster("normal", spawnPos);
                remaining--;
            }
        }
    }
    
  private GetRandomSpawnPoints(count: number): Vector[] {
    // 使用 Fisher-Yates 洗牌算法，避免 Lua sort 的问题
    const result: Vector[] = [];
    const available = [... SPAWN_POINTS];
    
    for (let i = 0; i < count && available.length > 0; i++) {
        const randomIndex = RandomInt(0, available.length - 1);
        result.push(available[randomIndex]);
        available.splice(randomIndex, 1);
    }
    
    return result;
}
    
private SpawnMonster(type: "normal" | "elite" | "boss", position?: Vector): CDOTA_BaseNPC | undefined {
    const spawnPoint = position || this.GetRandomPosition();
    let unitName = "npc_dota_creep_badguys_melee";
    
    if (type === "elite") {
        unitName = "npc_dota_creep_badguys_ranged";
    } else if (type === "boss") {
        unitName = "npc_dota_hero_skeleton_king";
    }
    
    const monster = CreateUnitByName(
        unitName,
        spawnPoint,
        true,
        undefined,
        undefined,
        DotaTeam. BADGUYS
    );
    
    if (monster) {
        (monster as any).zoneMonsterType = type;
        
        if (type === "elite") {
            monster.SetModelScale(2.0);
            this.ApplyMonsterScaling(monster, type);
            
            const affixes = AffixSystem.GenerateAffixes(type);
            AffixSystem.ApplyAffixes(monster, affixes);
            
            const affixText = AffixSystem.GetAffixDisplayText(affixes);
            this.BroadcastMessage(`精英怪 ${affixText}`, "#FFFFFF");
            
        } else if (type === "boss") {
            monster.SetModelScale(2.0);
            
            // 🔧 Boss 单独设置固定属性，不走疯狂的倍率系统
            this.SetupBossStats(monster);
            
            // 词条还是可以加，但不叠加属性
            const affixes = AffixSystem.GenerateAffixes(type);
            // 只显示词条名称，不应用属性加成
            const affixText = AffixSystem.GetAffixDisplayText(affixes);
            this.BroadcastMessage(`Boss ${affixText}`, "#FF0000");
            
        } else {
            this.ApplyMonsterScaling(monster, type);
        }
        
        this.monsters.push(monster);
        
        // 让怪物主动攻击玩家
        Timers.CreateTimer(0.5, () => {
            if (! IsValidEntity(monster) || ! monster.IsAlive()) return undefined;
            
            const nearestHero = this.FindNearestPlayerHero(monster. GetAbsOrigin());
            if (nearestHero) {
                monster.MoveToTargetToAttack(nearestHero);
            }
            return undefined;
        });
    }
    
    return monster;
}

// 🆕 新增函数：设置 Boss 固定属性
private SetupBossStats(boss: CDOTA_BaseNPC): void {
    Timers.CreateTimer(0.2, () => {
        if (!IsValidEntity(boss)) return undefined;
        
        if (boss.IsHero()) {
            const hero = boss as CDOTA_BaseNPC_Hero;
            
            // 🔧 固定属性，不叠加任何倍率
            hero.SetBaseStrength(150);       // 约 3300 血量
            hero. SetBaseAgility(10);         // 一点攻击力
            hero.SetBaseIntellect(20);
            
            // 🔧 关键：强制设置护甲
            hero.SetPhysicalArmorBaseValue(10);  // 固定 10 护甲
            
            // 额外增加血量到目标值
            const targetHealth = 15000;  // 目标血量
            Timers.CreateTimer(0.1, () => {
                if (! IsValidEntity(hero)) return undefined;
                
                const currentMax = hero.GetMaxHealth();
                if (currentMax < targetHealth) {
                    const extraStr = Math.floor((targetHealth - currentMax) / 22);
                    hero. ModifyStrength(extraStr);
                }
                
                // 再次强制设置护甲（加完力量后护甲会变）
                hero.SetPhysicalArmorBaseValue(10);
                
                hero.SetHealth(hero.GetMaxHealth());
                
                // 设置攻击力
                hero.SetBaseDamageMin(200);
                hero. SetBaseDamageMax(250);
                
                print(`[ZoneDungeon] Boss 设置完成: 血量=${hero.GetMaxHealth()}, 护甲=${hero.GetPhysicalArmorValue(false)}, 攻击=${hero.GetBaseDamageMax()}`);
                
                return undefined;
            });
        }
        
        return undefined;
    });
}
    
    private GetRandomPosition(): Vector {
        const x = RandomFloat(ZONE_BOUNDS.minX + 500, ZONE_BOUNDS.maxX - 500);
        const y = RandomFloat(ZONE_BOUNDS. minY + 500, ZONE_BOUNDS.maxY - 500);
        return Vector(x, y, ZONE_AREA.z);
    }
    
    private FindNearestPlayerHero(position: Vector): CDOTA_BaseNPC_Hero | undefined {
        let nearest: CDOTA_BaseNPC_Hero | undefined;
        let nearestDist = Infinity;
        
        for (const [, player] of this. players) {
            if (! player.isAlive || !player.hero || !IsValidEntity(player. hero)) continue;
            
            const heroPos = player.hero.GetAbsOrigin();
            const dist = ((position.x - heroPos.x) ** 2 + (position.y - heroPos.y) ** 2) ** 0.5;
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = player.hero;
            }
        }
        
        return nearest;
    }
    
private ApplyMonsterScaling(monster: CDOTA_BaseNPC, type: string): void {
    const playerCount = this.players.size;
    const scaling = PARTY_SCALING[playerCount] || PARTY_SCALING[1];
    const timeMultiplier = this.GetTimeMultiplier();
    
    // 计算票A词条加成
    let ticketMultiplier = 1.0;
    for (const [, player] of this.players) {
        ticketMultiplier += player.ticketAUsed * 0.1;
    }
    
    // 基础倍率
    let healthMult = scaling.health * timeMultiplier * ticketMultiplier;
    let damageMult = scaling.damage * timeMultiplier * ticketMultiplier;
    
    // 精英怪基础加成
    if (type === "elite") {
        healthMult *= 5.0;
        damageMult *= 3.0;
    } 
    // Boss大幅加成
    else if (type === "boss") {
        healthMult *= 50.0;
        damageMult *= 3.0;
    }
    
    // 🔧 延迟应用
    Timers.CreateTimer(0.1, () => {
        if (!IsValidEntity(monster)) return undefined;
        
         const isHero = monster.IsHero();
    
    // === 生命值 ===
    if (isHero) {
        const hero = monster as CDOTA_BaseNPC_Hero;
        
        // 🆕 Boss 直接设置固定属性，避免数值爆炸
        if (type === "boss") {
            hero.SetBaseStrength(800);      // 固定力量 = 约1760血量
            hero.SetBaseAgility(20);       // 固定敏捷
            hero.SetBaseIntellect(10);     // 固定智力
            hero.SetPhysicalArmorBaseValue(5);  // 🔧 固定5点护甲
            
            // 设置额外生命值
            const targetHealth = 8000 * healthMult;  // 基础8000血 * 倍率
            const currentMax = hero.GetMaxHealth();
            if (targetHealth > currentMax) {
                const extraStr = Math.floor((targetHealth - currentMax) / 22);
                hero. ModifyStrength(extraStr);
            }
            
            hero.SetHealth(hero.GetMaxHealth());
            
            // 🔧 再次强制设置护甲（属性加完后）
            Timers.CreateTimer(0.1, () => {
                if (IsValidEntity(hero)) {
                    hero.SetPhysicalArmorBaseValue(5);  // 保持5点护甲
                    print(`[ZoneDungeon] Boss 最终护甲: ${hero.GetPhysicalArmorValue(false)}`);
                }
                return undefined;
            });
            
        } else {
            // 精英怪保持原逻辑
            const currentHealth = hero.GetMaxHealth();
            const targetHealth = Math.floor(currentHealth * healthMult);
            const healthDiff = targetHealth - currentHealth;
            const strNeeded = Math.floor(healthDiff / 22);
            
            if (strNeeded > 0) {
                hero.ModifyStrength(strNeeded);
            }
        }
        
        Timers.CreateTimer(0.1, () => {
            if (IsValidEntity(hero)) {
                hero.SetHealth(hero.GetMaxHealth());
            }
            return undefined;
        });
        
    } else {
        // 普通单位逻辑不变
        const baseHealth = monster.GetMaxHealth();
        const newHealth = Math.floor(baseHealth * healthMult);
        monster.SetBaseMaxHealth(newHealth);
        monster.SetMaxHealth(newHealth);
        monster.SetHealth(newHealth);
    }
    
    // === 攻击力 ===
    if (isHero) {
        const hero = monster as CDOTA_BaseNPC_Hero;
        
        // 🆕 Boss 设置固定攻击力
        if (type === "boss") {
            const targetDamage = Math.floor(150 * damageMult);  // 基础150攻击
            hero.SetBaseDamageMin(targetDamage);
            hero. SetBaseDamageMax(targetDamage + 30);
        } else {
            const bonusDamage = Math.floor(100 * damageMult);
            hero.ModifyAgility(bonusDamage);
        }
        
    } else {
        const baseDamage = monster.GetBaseDamageMax();
        monster.SetBaseDamageMin(Math.floor(baseDamage * damageMult));
        monster.SetBaseDamageMax(Math.floor(baseDamage * damageMult));
    }
    
    print(`[ZoneDungeon] ${type} 缩放完成: 生命倍率=${healthMult}, 攻击倍率=${damageMult}`);
    
    return undefined;
});
}
    
    private GetTimeMultiplier(): number {
        const elapsed = GameRules. GetGameTime() - this.startTime;
        
        if (elapsed >= ZONE_CONFIG. DIFFICULTY_TIME_2) return ZONE_CONFIG.DIFFICULTY_MULT_2;
        if (elapsed >= ZONE_CONFIG. DIFFICULTY_TIME_1) return ZONE_CONFIG.DIFFICULTY_MULT_1;
        return 1.0;
    }
    
    private UpdateMonsterScaling(): void {
        // 人数变化时，新刷的怪会自动应用新倍率
        // 已存在的怪保持原属性
        print(`[ZoneDungeon] 人数变化，后续怪物将应用新倍率`);
    }
    
    // ==================== 击杀处理 ====================
    
private OnEntityKilled(event: EntityKilledEvent): void {
    if (!this.isActive) return;
    
    const killedUnit = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC;
    if (!killedUnit) return;
    
    // 检查是否是玩家死亡
    if (killedUnit. IsRealHero() && killedUnit. GetTeam() === DotaTeam.GOODGUYS) {
        this.OnPlayerDeath(killedUnit as CDOTA_BaseNPC_Hero);
        return;
    }
    
    // 检查是否是我们的怪物
    const index = this.monsters.indexOf(killedUnit);
    if (index === -1) {
        if ((killedUnit as any).isSplitling || (killedUnit as any).isSummonedMinion) {
            this.teamScore += 1;
            
            // 🆕 分裂物/召唤物也有少量掉落
            const playerIds = Array.from(this. players.keys());
            ZoneLootSystem. ProcessLoot("normal", playerIds, 0.5);
        }
        return;
    }
    
    // 移除怪物
    this.monsters. splice(index, 1);
    
    const monsterType = (killedUnit as any).zoneMonsterType as "normal" | "elite" | "boss" || "normal";
    const score = MONSTER_SCORE[monsterType] || 1;
    
    // 处理词条系统
    const affixes = AffixSystem.OnMonsterDeath(killedUnit);
    
    // 🆕 计算掉落加成
    let dropBonus = 1.0;
    if (affixes && affixes.length > 0) {
        dropBonus = AffixSystem.GetDropBonus(affixes);  // 每个词条 +20%
    }
    
    // 🆕 处理掉落 - 为所有玩家独立计算
    const playerIds = Array.from(this.players. keys());
    ZoneLootSystem. ProcessLoot(monsterType, playerIds, dropBonus);
    
    // 清理怪物特效
    this.CleanupMonsterEffects(killedUnit);
    
    this.teamScore += score;
    
    if (affixes && affixes. length > 0) {
        const affixText = AffixSystem.GetAffixDisplayText(affixes);
        const typeName = monsterType === "elite" ? "精英怪" : "Boss";
        this.BroadcastMessage(
            `击杀 ${typeName} ${affixText}，积分 +${score}，掉落加成 x${dropBonus. toFixed(1)}`,
            "#FFD700"
        );
    }
    
    this.CheckScoreTrigger();
}

// 🆕 新增函数：清理怪物所有特效
private CleanupMonsterEffects(monster: CDOTA_BaseNPC): void {
    // 🔧 手动清理所有可能的特效
    const particleKeys = [
        'affixParticle',
        'frozenAuraParticle', 
        'burnAuraParticle',
        'enrageParticle',
        'shieldParticle',
        'bossParticle'
    ];
    
    for (const key of particleKeys) {
        const particle = (monster as any)[key];
        if (particle !== undefined && particle !== null) {
            ParticleManager.DestroyParticle(particle, true);
            ParticleManager.ReleaseParticleIndex(particle);
            (monster as any)[key] = null;
        }
    }
    
    // 🔧 英雄单位延迟移除尸体
    if (monster.IsHero()) {
        Timers.CreateTimer(2.0, () => {
            if (IsValidEntity(monster)) {
                UTIL_Remove(monster);
            }
            return undefined;
        });
    }
}
    
private CheckScoreTrigger(): void {
    print(`[ZoneDungeon] 检查触发: 当前积分=${this.teamScore}, 精英阈值=${this.eliteThreshold}, Boss阈值=${this. bossThreshold}`);
    
    // 检查精英触发
    while (this.teamScore >= this.eliteThreshold) {
        this.eliteThreshold += ZONE_CONFIG. ELITE_TRIGGER_SCORE;
        this.TriggerElite();
    }
    
    // 检查Boss触发
    while (this.teamScore >= this.bossThreshold) {
        print(`[ZoneDungeon] 🔴 触发Boss!  积分=${this.teamScore}, 阈值=${this. bossThreshold}`);
        this. bossThreshold += ZONE_CONFIG. BOSS_TRIGGER_SCORE;
        this.TriggerBoss();
    }
}
    
    private TriggerElite(): void {
        const spawnPos = this.GetRandomPosition();
        this.BroadcastMessage(`🟡 精英怪物出现了！`, "#FFFF00");
        
        const elite = this.SpawnMonster("elite", spawnPos);
        if (elite) {
            // 精英特效
            const particle = ParticleManager.CreateParticle(
                "particles/items2_fx/smoke_of_deceit_buff.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                elite
            );
            ParticleManager.SetParticleControl(particle, 0, elite.GetAbsOrigin());
        }
    }
    
 private TriggerBoss(): void {
    print(`[ZoneDungeon] ========== Boss降临 ==========`);
    
    const spawnPos = this.GetRandomPosition();
    this.BroadcastMessage(`🔴 小Boss降临！`, "#FF0000");
    
    // 播放音效给所有玩家
    for (const [, player] of this. players) {
        if (player.hero && IsValidEntity(player.hero)) {
            EmitSoundOn("Hero_WraithKing.Hellfire", player.hero);
        }
    }
    
    const boss = this.SpawnMonster("boss", spawnPos);
    if (boss) {
        print(`[ZoneDungeon] ✅ Boss生成成功: ${boss.GetUnitName()}`);
        
        // Boss特效
        const particle = ParticleManager.CreateParticle(
            "particles/econ/events/ti10/portal/portal_open_good.vpcf",
            ParticleAttachment.ABSORIGIN,
            boss
        );
        ParticleManager.SetParticleControl(particle, 0, boss. GetAbsOrigin());
    } else {
        print(`[ZoneDungeon] ❌ Boss生成失败! `);
    }
}
    
    // ==================== 玩家死亡 ====================
    
    private OnPlayerDeath(hero: CDOTA_BaseNPC_Hero): void {
        const playerId = hero.GetPlayerID();
        const player = this.players.get(playerId);
        
        if (!player) return;
        
        player.isAlive = false;
        
        GameRules.SendCustomMessage(
            `<font color='#FF6600'>💀 你已死亡！输入 -rejoin 消耗2倍票A重新进入</font>`,
            playerId,
            0
        );
        
        // 传送回城
        Timers.CreateTimer(3.0, () => {
            if (! hero || !IsValidEntity(hero)) return undefined;
            
            hero.RespawnHero(false, false);
            FindClearSpaceForUnit(hero, TOWN_SPAWN, true);
            
            return undefined;
        });
        
        // 通知其他玩家
        this.BroadcastMessage(`💀 有玩家阵亡！`, "#FF6600");
        
        // 检查是否全灭
        const aliveCount = Array.from(this. players.values()).filter(p => p. isAlive).length;
        if (aliveCount === 0) {
            this.BroadcastMessage(`☠️ 全军覆没！副本结束`, "#FF0000");
            Timers.CreateTimer(3.0, () => {
                this. EndZone();
                return undefined;
            });
        }
    }
    
    // ==================== 结束逻辑 ====================
    
    private EndZone(): void {
        print(`[ZoneDungeon] ========== 刷怪区域结束 ==========`);
        print(`[ZoneDungeon] 总积分：${this. teamScore}`);
        
        this.isActive = false;
        
        // 清理计时器
        if (this.mainTimer) Timers.RemoveTimer(this. mainTimer);
        if (this.spawnTimer) Timers.RemoveTimer(this.spawnTimer);
        
        // 清理怪物
        for (const monster of this.monsters) {
            if (IsValidEntity(monster) && monster.IsAlive()) {
                monster.ForceKill(false);
            }
        }
        this.monsters = [];
        
        // 传送所有玩家回城并显示结算
        for (const [playerId, player] of this.players) {
            if (player.hero && IsValidEntity(player.hero)) {
                // 确保玩家复活
                if (! player.hero.IsAlive()) {
                    player.hero.RespawnHero(false, false);
                }
                FindClearSpaceForUnit(player.hero, TOWN_SPAWN, true);
            }
            
            GameRules.SendCustomMessage(
                `<font color='#00FFFF'>🏠 刷怪区域结束，已返回主城</font>`,
                playerId,
                0
            );
            GameRules.SendCustomMessage(
                `<font color='#FFD700'>📊 本次总积分：${this.teamScore}</font>`,
                playerId,
                0
            );
        }
        
        this.players.clear();
    }
    
    // ==================== 工具方法 ====================
    
    private BroadcastMessage(message: string, color: string): void {
        for (const [playerId] of this.players) {
            GameRules.SendCustomMessage(
                `<font color='${color}'>${message}</font>`,
                playerId,
                0
            );
        }
    }
    
    // ==================== 状态查询 ====================
    
    public IsActive(): boolean {
        return this.isActive;
    }
    
    public GetPlayerCount(): number {
        return this.players.size;
    }
    
    public GetTeamScore(): number {
        return this.teamScore;
    }
}