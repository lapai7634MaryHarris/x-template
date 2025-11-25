import { 
    SPAWN_POINT, 
    ROOM1_ENTRANCE, 
    ROOM2_ENTRANCE,
    ROOM3_ENTRANCE,  // ✅ 导入Boss房
    ROOM1_MONSTERS, 
    ROOM2_MONSTERS,
    ROOM3_BOSS       // ✅ 导入Boss位置
} from "./simple_config";

export class SimpleDungeon {
    private monsters: CDOTA_BaseNPC[] = [];
    private currentRoom: number = 0;
    private playerId: PlayerID | undefined;

    constructor() {
        print("=".repeat(50));
        print("[SimpleDungeon] Constructor called!");
        print("=".repeat(50));
        
        this.RegisterCommand();
        this.ListenToEvents();
        this.ListenToChatCommand();
        
        print("[SimpleDungeon] Ready! Type -start in chat");
    }

    private ListenToChatCommand(): void {
        ListenToGameEvent("player_chat", (event) => {
            const text = event.text;
            print(`[SimpleDungeon] Received chat: "${text}"`);
            
            if (text === "-start" || text === "start") {
                const playerId = event.playerid as PlayerID;
                print(`[SimpleDungeon] Start command triggered by player ${playerId}`);
                this.StartDungeon(playerId);
            }
        }, this);
        
        print("[SimpleDungeon] Chat listener registered");
    }

    private RegisterCommand(): void {
        Convars.RegisterCommand("start", () => {
            print("[SimpleDungeon] Console command triggered!");
            const playerController = Convars.GetCommandClient();
            if (playerController) {
                const playerId = playerController.GetPlayerID();
                this.StartDungeon(playerId);
            }
        }, "Start dungeon", 0);
        
        print("[SimpleDungeon] Console command registered");
    }

    private ListenToEvents(): void {
        ListenToGameEvent("entity_killed", (event) => {
            this.OnEntityKilled(event);
        }, this);
        
        print("[SimpleDungeon] Death event listener registered");
    }

    private StartDungeon(playerId: PlayerID): void {
        print(`[SimpleDungeon] ========== START DUNGEON ==========`);
        print(`[SimpleDungeon] Player ID: ${playerId}`);
        
        this.playerId = playerId;
        this.currentRoom = 1;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) {
            print("[SimpleDungeon] ERROR: No hero found!");
            return;
        }

        print(`[SimpleDungeon] Hero: ${hero.GetUnitName()}`);

        // 传送到房间1
        this.TeleportToRoom(hero, 1);
        
        // 刷房间1的怪
        this.SpawnMonstersForRoom(1);
        
        GameRules.SendCustomMessage("<font color='#00FF00'>副本开始！房间 1/3</font>", playerId, 0);  // ✅ 改为 1/3
    }

    private TeleportToRoom(hero: CDOTA_BaseNPC_Hero, roomNumber: number): void {
        let position: Vector;
        
        if (roomNumber === 1) {
            position = ROOM1_ENTRANCE;
        } else if (roomNumber === 2) {
            position = ROOM2_ENTRANCE;
        } else if (roomNumber === 3) {  // ✅ 新增：Boss房传送
            position = ROOM3_ENTRANCE;
        } else {
            print(`[SimpleDungeon] Invalid room number: ${roomNumber}`);
            return;
        }

        FindClearSpaceForUnit(hero, position, true);
        print(`[SimpleDungeon] Teleported to room ${roomNumber} at ${position}`);
    }

    private SpawnMonstersForRoom(roomNumber: number): void {
        print(`[SimpleDungeon] ========== SPAWN ROOM ${roomNumber} ==========`);
        
        // 清空旧怪物
        this.monsters = [];

        let spawnPoints: Vector[];
        let monsterCount: number;
        let unitName: string;

         if (roomNumber === 1) {
        spawnPoints = ROOM1_MONSTERS;
        monsterCount = 3;
        unitName = "npc_dota_creep_badguys_melee";
    } else if (roomNumber === 2) {
        spawnPoints = ROOM2_MONSTERS;
        monsterCount = 5;
        unitName = "npc_dota_creep_badguys_melee";
    } else if (roomNumber === 3) {
        spawnPoints = ROOM3_BOSS;
        monsterCount = 1;
        // ✅ 使用英雄作为Boss（非常可靠）
        unitName = "npc_dota_hero_axe";           // 斧王Boss
        // unitName = "npc_dota_hero_sven";       // 斯温Boss
        // unitName = "npc_dota_hero_centaur";    // 人马Boss
    }else {
        print(`[SimpleDungeon] Invalid room: ${roomNumber}`);
        return;
    }
        for (let i = 0; i < spawnPoints.length && i < monsterCount; i++) {
            const pos = spawnPoints[i];
            print(`[SimpleDungeon] Spawning ${unitName} ${i+1} at ${pos}`);
            
            const monster = CreateUnitByName(
                unitName,
                pos,
                true,
                undefined,
                undefined,
                DotaTeam.BADGUYS
            );

            if (monster) {
                // ✅ Boss特殊强化
                if (roomNumber === 3) {
                    this.EnhanceBoss(monster);
                }
                
                this.monsters.push(monster);
                print(`[SimpleDungeon] ✓ ${unitName} ${i+1} created`);
            } else {
                print(`[SimpleDungeon] ✗ Failed to create ${unitName} ${i+1}`);
            }
        }

        print(`[SimpleDungeon] Room ${roomNumber}: ${this.monsters.length} monsters spawned`);
    }

    
   // ✅ 新增：Boss强化
private EnhanceBoss(boss: CDOTA_BaseNPC): void {
    print("[SimpleDungeon] Enhancing Boss...");
    
    // ✅ 如果是英雄单位
    if (boss.IsHero()) {
        const heroBoss = boss as CDOTA_BaseNPC_Hero;
        
        // 设置敌对
        heroBoss.SetTeam(DotaTeam.BADGUYS);
        
        // 设置等级
        heroBoss.SetAbilityPoints(0);
        for (let i = 1; i <= 10; i++) {
            heroBoss.HeroLevelUp(false);
        }
        
        // 增加属性
        heroBoss.SetBaseStrength(100);
        heroBoss.SetBaseAgility(50);
        heroBoss.SetBaseIntellect(50);
        
        // 满血满蓝
        heroBoss.SetHealth(heroBoss.GetMaxHealth());
        heroBoss.SetMana(heroBoss.GetMaxMana());
        
        // 主动攻击
        Timers.CreateTimer(0.5, () => {
            if (this.playerId !== undefined) {
                const hero = PlayerResource.GetSelectedHeroEntity(this.playerId);
                if (hero && heroBoss.IsAlive()) {
                    heroBoss.MoveToTargetToAttack(hero);
                }
            }
            return undefined;
        });
        
    } else {
        // 原来的非英雄Boss强化
        boss.SetTeam(DotaTeam.BADGUYS);
        boss.SetAttackCapability(UnitAttackCapability.MELEE_ATTACK);
        boss.RemoveModifierByName("modifier_invulnerable");
        
        const maxHealth = boss.GetMaxHealth();
        boss.SetBaseMaxHealth(maxHealth * 5);
        boss.SetHealth(boss.GetMaxHealth());
        
        const baseAttack = boss.GetBaseDamageMax();
        boss.SetBaseDamageMin(baseAttack * 2);
        boss.SetBaseDamageMax(baseAttack * 2);
        
        boss.SetBaseMoveSpeed(350);
    }
    
    // 光环特效
    const particle = ParticleManager.CreateParticle(
        "particles/items2_fx/smoke_of_deceit_buff.vpcf",
        ParticleAttachment.ABSORIGIN_FOLLOW,
        boss
    );
    ParticleManager.SetParticleControl(particle, 0, boss.GetAbsOrigin());
    
    print(`[SimpleDungeon] Boss enhanced! HP: ${boss.GetMaxHealth()}`);
}

    private OnEntityKilled(event: EntityKilledEvent): void {
        const killedUnit = EntIndexToHScript(event.entindex_killed);
        if (!killedUnit) return;

        const index = this.monsters.indexOf(killedUnit as CDOTA_BaseNPC);
        if (index !== -1) {
            this.monsters.splice(index, 1);
            print(`[SimpleDungeon] Monster killed! Remaining: ${this.monsters.length}`);

            // 显示剩余怪物
            if (this.playerId !== undefined) {
                // ✅ Boss房特殊提示
                if (this.currentRoom === 3) {
                    GameRules.SendCustomMessage(
                        `<font color='#FF0000'>Boss战斗中...</font>`, 
                        this.playerId, 
                        0
                    );
                } else {
                    GameRules.SendCustomMessage(
                        `<font color='#FFFF00'>剩余怪物: ${this.monsters.length}</font>`, 
                        this.playerId, 
                        0
                    );
                }
            }

            if (this.monsters.length === 0) {
                this.OnRoomCleared();
            }
        }
    }

    private OnRoomCleared(): void {
        print(`[SimpleDungeon] ========== ROOM ${this.currentRoom} CLEARED ==========`);

        if (this.playerId === undefined) return;

        if (this.currentRoom === 1) {
            // 房间1清空，进入房间2
            GameRules.SendCustomMessage(
                "<font color='#00FF00'>✓ 房间1清空！3秒后传送到房间2...</font>", 
                this.playerId, 
                0
            );

            Timers.CreateTimer(3.0, () => {
                const hero = PlayerResource.GetSelectedHeroEntity(this.playerId!);
                if (hero) {
                    this.currentRoom = 2;
                    this.TeleportToRoom(hero, 2);
                    
                    Timers.CreateTimer(1.0, () => {
                        this.SpawnMonstersForRoom(2);
                        GameRules.SendCustomMessage(
                            "<font color='#FFA500'>房间 2/3 - 击败5个怪物！</font>",  // ✅ 改为 2/3
                            this.playerId!, 
                            0
                        );
                        return undefined;
                    });
                }
                return undefined;
            });

        } else if (this.currentRoom === 2) {
            // ✅ 房间2清空，进入Boss房
            GameRules.SendCustomMessage(
                "<font color='#00FF00'>✓ 房间2清空！准备面对Boss...</font>", 
                this.playerId, 
                0
            );

            Timers.CreateTimer(3.0, () => {
                const hero = PlayerResource.GetSelectedHeroEntity(this.playerId!);
                if (hero) {
                    this.currentRoom = 3;
                    this.TeleportToRoom(hero, 3);
                    
                    Timers.CreateTimer(1.0, () => {
                        this.SpawnMonstersForRoom(3);
                        GameRules.SendCustomMessage(
                            "<font color='#FF0000'>房间 3/3 - ⚔️ Boss战！击败肉山！</font>", 
                            this.playerId!, 
                            0
                        );
                        return undefined;
                    });
                }
                return undefined;
            });

        } else if (this.currentRoom === 3) {
            // ✅ Boss房清空，副本完成
            this.OnComplete();
        }
    }

    private OnComplete(): void {
        print("=".repeat(50));
        print("[SimpleDungeon] 🎉 DUNGEON COMPLETE! 🎉");
        print("=".repeat(50));
        
        if (this.playerId !== undefined) {
            // ✅ Boss击败特殊奖励
            const hero = PlayerResource.GetSelectedHeroEntity(this.playerId);
            if (hero) {
                // 给予金币
                hero.ModifyGold(1000, true, 0);
                
                // 给予经验
                hero.AddExperience(500, ModifyXpReason.UNSPECIFIED, false, true);
                
                GameRules.SendCustomMessage(
                    "<font color='#FFD700'>🎉 副本完成！击败Boss！</font>", 
                    this.playerId, 
                    0
                );
                
                // ✅ 显示奖励
                Timers.CreateTimer(0.5, () => {
                    GameRules.SendCustomMessage(
                        "<font color='#00FF00'>奖励：+1000金币 +500经验</font>", 
                        this.playerId!, 
                        0
                    );
                    return undefined;
                });
            }

            // 5秒后传送回主城（给玩家看奖励的时间）
            Timers.CreateTimer(5.0, () => {
                const hero = PlayerResource.GetSelectedHeroEntity(this.playerId!);
                if (hero) {
                    FindClearSpaceForUnit(hero, SPAWN_POINT, true);
                    GameRules.SendCustomMessage(
                        "<font color='#00FFFF'>已返回主城</font>", 
                        this.playerId!, 
                        0
                    );
                }
                return undefined;
            });
        }

        // 重置状态
        this.currentRoom = 0;
        this.monsters = [];
    }
}