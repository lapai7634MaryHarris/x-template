import { 
    SPAWN_POINT, 
    ROOM1_ENTRANCE, 
    ROOM2_ENTRANCE,
    ROOM3_ENTRANCE,
    ROOM1_MONSTERS, 
    ROOM2_MONSTERS,
    ROOM3_BOSS
} from "./simple_config";
import { ShadowFiendBoss } from "./boss/shadow_fiend_boss";
import { LootSystem } from "./loot_system";
import { DungeonDifficulty, DIFFICULTY_NAMES, DIFFICULTY_MULTIPLIERS } from "./reward_config";
import { EXTERNAL_REWARD_POOL, ExternalRewardItem } from "./external_reward_pool";
import { EquipmentVaultSystem } from "../systems/equipment_vault_system";

export class SimpleDungeon {
    private monsters: CDOTA_BaseNPC[] = [];
    private currentRoom: number = 0;
    private playerId: PlayerID | undefined;
    private bossManager: ShadowFiendBoss | undefined;
    private currentDifficulty: DungeonDifficulty = DungeonDifficulty.NORMAL_1;
    private currentRewards: ExternalRewardItem[] = [];
    
    constructor() {
        print("=".repeat(50));
        print("[SimpleDungeon] Constructor called!");
        print("=".repeat(50));
        
        this.RegisterCommand();
        this.ListenToEvents();
        this.ListenToChatCommand();
        this.RegisterRewardSelectionListener();
        
        print("[SimpleDungeon] Ready!  Type -start in chat");
    }

    private ListenToChatCommand(): void {
        ListenToGameEvent("player_chat", (event) => {
            const text = event.text.trim();
            const playerId = event.playerid as PlayerID;
            
            print(`[SimpleDungeon] Received chat: "${text}"`);
            
            if (text === "-start" || text === "start") {
                print(`[SimpleDungeon] Start command triggered by player ${playerId}`);
                this.StartDungeon(playerId);
            }
            
           if (text === "-vault" || text === "vault" || text === "-v" || text === "v") {
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
        (CustomGameEventManager.Send_ServerToPlayer as any)(player, 'show_vault_ui', {});
        
        const vault = EquipmentVaultSystem.GetVault(playerId);
        
        // ⭐ 序列化仓库数据
        const serializedVault: any[] = [];
        vault.forEach((item) => {
            serializedVault.push({
                name: item.name,
                type: item.type,
                icon: item.icon,
                stats: item.stats,
                rarity: item.rarity,
                // ⭐ 序列化 affixDetails
                affixDetails: item.affixDetails ?  item.affixDetails. map(affix => ({
                    position: affix.position,
                    tier: affix.tier,
                    name: affix.name,
                    description: affix.description,
                    color: affix.color,
                })) : undefined,
            });
        });
        
        (CustomGameEventManager. Send_ServerToPlayer as any)(player, 'update_vault_ui', {
            items: serializedVault  // ⭐ 发送序列化后的数据
        });
        
        print(`[SimpleDungeon] 打开仓库 UI，发送 ${vault.length} 件装备数据`);
    }
}
        }, this);
        
CustomGameEventManager.RegisterListener("equip_item_from_vault", (userId, event: any) => {
    const playerId = event.PlayerID as PlayerID;
    const index = event.index as number;
    
    print(`[SimpleDungeon] 玩家${playerId}从 UI 装备索引${index}的物品`);
    
    if (EquipmentVaultSystem.EquipItem(playerId, index)) {
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            // ⭐ 序列化仓库数据
            const vault = EquipmentVaultSystem.GetVault(playerId);
            const serializedVault: any[] = [];
            vault.forEach((item) => {
                serializedVault.push({
                    name: item.name,
                    type: item.type,
                    icon: item.icon,
                    stats: item.stats,
                    rarity: item.rarity,
                    // ⭐ 序列化 affixDetails
                    affixDetails: item.affixDetails ?  item.affixDetails. map(affix => ({
                        position: affix.position,
                        tier: affix.tier,
                        name: affix.name,
                        description: affix.description,
                        color: affix.color,
                    })) : undefined,
                });
            });
            
            // ⭐ 序列化装备数据
            const equipment = EquipmentVaultSystem.GetEquipment(playerId);
            const serializedEquipment: any = {};
            for (const slot in equipment) {
                const item = equipment[slot];
                if (item) {
                    serializedEquipment[slot] = {
                        name: item.name,
                        type: item. type,
                        icon: item.icon,
                        stats: item.stats,
                        rarity: item.rarity,
                        // ⭐ 序列化 affixDetails
                        affixDetails: item.affixDetails ? item.affixDetails.map(affix => ({
                            position: affix.position,
                            tier: affix.tier,
                            name: affix.name,
                            description: affix.description,
                            color: affix.color,
                        })) : undefined,
                    };
                } else {
                    serializedEquipment[slot] = null;
                }
            }
            
            // ⭐ 同时发送仓库和装备数据
            (CustomGameEventManager.Send_ServerToPlayer as any)(player, 'update_vault_ui', {
                items: serializedVault
            });
            
            (CustomGameEventManager.Send_ServerToPlayer as any)(player, 'update_equipment_ui', {
                equipment: serializedEquipment
            });
            
            GameRules.SendCustomMessage(
                "✅ 装备成功！",
                playerId,
                0
            );
            
            print(`[SimpleDungeon] 装备成功，已推送更新数据`);
        }
    } else {
        GameRules.SendCustomMessage(
            "❌ 装备失败！",
            playerId,
            0
        );
    }
});
        
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

    public StartDungeon(playerId: PlayerID, difficulty?: string): void {
        const diff = difficulty || "normal_1";
        print(`[SimpleDungeon] ========== START DUNGEON ==========`);
        print(`[SimpleDungeon] Player ID: ${playerId}, Difficulty: ${diff}`);
        
        const difficultyMap: Record<string, DungeonDifficulty> = {
            "easy_1": DungeonDifficulty.EASY_1,
            "easy_2": DungeonDifficulty.EASY_2,
            "easy_3": DungeonDifficulty.EASY_3,
            "normal_1": DungeonDifficulty.NORMAL_1,
            "normal_2": DungeonDifficulty.NORMAL_2,
            "normal_3": DungeonDifficulty.NORMAL_3,
            "hard_1": DungeonDifficulty.HARD_1,
            "hard_2": DungeonDifficulty.HARD_2,
            "hard_3": DungeonDifficulty.HARD_3
        };
        
        this.currentDifficulty = difficultyMap[diff] || DungeonDifficulty.NORMAL_1;
        this.playerId = playerId;
        this.currentRoom = 1;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (! hero) {
            print("[SimpleDungeon] ERROR: No hero found!");
            return;
        }

        print(`[SimpleDungeon] Hero: ${hero.GetUnitName()}`);
        this.TeleportToRoom(hero, 1);
        this.SpawnMonstersForRoom(1);
        
        const diffName = DIFFICULTY_NAMES[this.currentDifficulty];
        GameRules.SendCustomMessage(
            `<font color='#00FF00'>副本开始！房间 1/3 - ${diffName}</font>`, 
            playerId, 
            0
        );
    }

    private TeleportToRoom(hero: CDOTA_BaseNPC_Hero, roomNumber: number): void {
        let position: Vector;
        
        if (roomNumber === 1) {
            position = ROOM1_ENTRANCE;
        } else if (roomNumber === 2) {
            position = ROOM2_ENTRANCE;
        } else if (roomNumber === 3) {
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
            unitName = "npc_dota_hero_nevermore";
        } else {
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

    private EnhanceBoss(boss: CDOTA_BaseNPC): void {
        print("[SimpleDungeon] Enhancing Boss...");
        
        const multiplier = DIFFICULTY_MULTIPLIERS[this.currentDifficulty];
        print(`[SimpleDungeon] Difficulty multiplier: ${multiplier}`);
        
        if (boss.IsHero()) {
            const heroBoss = boss as CDOTA_BaseNPC_Hero;
            
            heroBoss.SetTeam(DotaTeam.BADGUYS);
            heroBoss.SetAbilityPoints(0);
            
            for (let i = 1; i <= 10; i++) {
                heroBoss.HeroLevelUp(false);
            }
            
            heroBoss.SetBaseStrength(Math.floor(500 * multiplier));
            heroBoss.SetBaseAgility(Math.floor(50 * multiplier));
            heroBoss.SetBaseIntellect(Math.floor(50 * multiplier));
            heroBoss.SetHealth(heroBoss.GetMaxHealth());
            heroBoss.SetMana(heroBoss.GetMaxMana());
            
            if (boss.GetUnitName() === "npc_dota_hero_nevermore") {
                print("[SimpleDungeon] Setting up Shadow Fiend Boss...");
                
                boss.SetMoveCapability(UnitMoveCapability.NONE);
                boss.AddNewModifier(boss, undefined, "modifier_invulnerable", {});
                
                Timers.CreateTimer(1, () => {
                    if (! boss.IsAlive()) return undefined;
                    
                    print("[SimpleDungeon] Boss model loaded, processing abilities...");
                    
                    const abilitiesToRemove = [
                        "nevermore_shadowraze1",
                        "nevermore_shadowraze2",
                        "nevermore_shadowraze3",
                        "nevermore_necromastery",
                        "nevermore_dark_lord",
                        "nevermore_requiem"
                    ];
                    
                    for (const abilityName of abilitiesToRemove) {
                        const ability = boss.FindAbilityByName(abilityName);
                        if (ability) {
                            boss.RemoveAbility(abilityName);
                        }
                    }
                    
                    Timers.CreateTimer(0.3, () => {
                        if (!boss.IsAlive()) return undefined;
                        
                        print("[SimpleDungeon] Adding shadow_explosion ability...");
                        
                        let explosionAbility = boss.FindAbilityByName("shadow_explosion");
                        if (!explosionAbility) {
                            explosionAbility = boss.AddAbility("shadow_explosion");
                        }
                        
                        if (explosionAbility) {
                            explosionAbility.SetLevel(1);
                            print("[SimpleDungeon] ✓ Shadow Explosion ability ready!");
                        } else {
                            print("[SimpleDungeon] ✗ Failed to add shadow_explosion!");
                        }
                        
                        Timers.CreateTimer(0.3, () => {
                            if (!boss.IsAlive() || this.playerId === undefined) return undefined;
                            
                            print("[SimpleDungeon] Initializing Boss Manager...");
                            this.bossManager = new ShadowFiendBoss(boss, this.playerId);
                            print("[SimpleDungeon] ✓ Boss Manager initialized!");
                            
                            Timers.CreateTimer(1, () => {
                                if (!boss.IsAlive()) return undefined;
                                
                                boss.RemoveModifierByName("modifier_invulnerable");
                                print("[SimpleDungeon] ✓ Boss is now vulnerable!  Fight begins!");
                                
                                if (this.playerId !== undefined) {
                                    GameRules.SendCustomMessage(
                                        "<font color='#FF0000'>暗影领主苏醒了！战斗开始！</font>",
                                        this.playerId,
                                        0
                                    );
                                }
                                
                                return undefined;
                            });

                            return undefined;
                        });
                        
                        return undefined;
                    });
                    
                    return undefined;
                });
                
            } else {
                Timers.CreateTimer(0.5, () => {
                    if (this.playerId !== undefined) {
                        const hero = PlayerResource.GetSelectedHeroEntity(this.playerId);
                        if (hero && heroBoss.IsAlive()) {
                            heroBoss.MoveToTargetToAttack(hero);
                        }
                    }
                    return undefined;
                });
            }
            
        } else {
            boss.SetTeam(DotaTeam.BADGUYS);
            boss.SetAttackCapability(UnitAttackCapability.MELEE_ATTACK);
            boss.RemoveModifierByName("modifier_invulnerable");
            
            const maxHealth = boss.GetMaxHealth();
            boss.SetBaseMaxHealth(Math.floor(maxHealth * 5 * multiplier));
            boss.SetHealth(boss.GetMaxHealth());
            
            const baseAttack = boss.GetBaseDamageMax();
            boss.SetBaseDamageMin(Math.floor(baseAttack * 2 * multiplier));
            boss.SetBaseDamageMax(Math.floor(baseAttack * 2 * multiplier));
            boss.SetBaseMoveSpeed(350);
        }
        
        const particle = ParticleManager.CreateParticle(
            "particles/items2_fx/smoke_of_deceit_buff.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            boss
        );
        ParticleManager.SetParticleControl(particle, 0, boss.GetAbsOrigin());
        
        print(`[SimpleDungeon] Boss enhanced!  HP: ${boss.GetMaxHealth()}`);
    }

    // ⭐ 修复：直接发送完整对象
    private TriggerRewardSelection(): void {
        print("[SimpleDungeon] Triggering reward selection!");

        const playerId = this.playerId;
        if (!playerId) return;

        this.currentRewards = this.GenerateRewards();
        print(`[SimpleDungeon] Generated rewards: ${this.currentRewards.map(r => r.name).join(", ")}`);

        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            CustomGameEventManager.Send_ServerToPlayer(
                player,
                "show_reward_selection",
                { 
                    rewards: this.currentRewards  // ⭐ 直接发送完整对象，包含 stats 数组
                }
            );
            print("[SimpleDungeon] ✓ Sent reward data to client");
        } else {
            print("[SimpleDungeon] ❌ Could not find player!");
        }
    }

    private GenerateRewards(): ExternalRewardItem[] {
        const rewards: ExternalRewardItem[] = [];
        const pool = [...EXTERNAL_REWARD_POOL];

        for (let i = 0; i < 3; i++) {
            if (pool.length === 0) break;

            const randomIndex = Math.floor(Math.random() * pool.length);
            rewards.push(pool[randomIndex]);
            pool.splice(randomIndex, 1);
        }

        return rewards;
    }

    private RegisterRewardSelectionListener(): void {
        CustomGameEventManager.RegisterListener("reward_selected", (userId, event) => {
            const eventData = event as any;
            const playerId = eventData.PlayerID as PlayerID;
            const rewardIndex = eventData.rewardIndex as number;
            
            print(`[SimpleDungeon] 玩家${playerId}选择了奖励索引：${rewardIndex}`);
            
            if (rewardIndex >= 0 && rewardIndex < this.currentRewards.length) {
                const selectedReward = this.currentRewards[rewardIndex];
                
                EquipmentVaultSystem.SaveToVault(playerId, selectedReward);
                
                print(`[SimpleDungeon] ✓ 已保存奖励：${selectedReward.name}`);
                
                // ⭐ 修复：使用 stats 数组
                const statsText = selectedReward.stats.map(s => `${s.attribute} +${s.value}`).join(", ");
                GameRules.SendCustomMessage(
                    `<font color='#FF6EC7'>💾 已保存装备：${selectedReward.name} (${statsText})</font>`,
                    playerId,
                    0
                );
            } else {
                print(`[SimpleDungeon] ❌ 无效的奖励索引：${rewardIndex}`);
            }
        });
        
        print("[SimpleDungeon] Reward selection listener registered");
    }

    private OnEntityKilled(event: EntityKilledEvent): void {
        const killedUnit = EntIndexToHScript(event.entindex_killed);
        if (! killedUnit) return;

        const index = this.monsters.indexOf(killedUnit as CDOTA_BaseNPC);
        if (index !== -1) {
            this.monsters.splice(index, 1);
            print(`[SimpleDungeon] Monster killed!  Remaining: ${this.monsters.length}`);

            if (this.monsters.length === 0) {
                print(`[SimpleDungeon] 所有怪物已被击杀，房间 ${this.currentRoom} 清空`);
                
                if (this.currentRoom === 3 && this.playerId !== undefined) {
                    LootSystem.DropBossLoot(
                        killedUnit as CDOTA_BaseNPC, 
                        this.currentDifficulty, 
                        this.playerId
                    );
                    
                    this.TriggerRewardSelection();
                }
                
                this.OnRoomCleared();
            }
        }
    }

    private OnRoomCleared(): void {
        print(`[SimpleDungeon] ========== ROOM ${this.currentRoom} CLEARED ==========`);

        if (this.playerId === undefined) return;

        if (this.currentRoom === 1) {
            GameRules.SendCustomMessage(
                "<font color='#00FF00'>✓ 房间1清空！3秒后传送到房间2...</font>", 
                this.playerId, 
                0
            );

            Timers.CreateTimer(3.0, () => {
                const hero = PlayerResource.GetSelectedHeroEntity(this.playerId! );
                if (hero) {
                    this.currentRoom = 2;
                    this.TeleportToRoom(hero, 2);
                    
                    Timers.CreateTimer(1.0, () => {
                        this.SpawnMonstersForRoom(2);
                        GameRules.SendCustomMessage(
                            "<font color='#FFA500'>房间 2/3 - 击败5个怪物！</font>",
                            this.playerId!, 
                            0
                        );
                        return undefined;
                    });
                }
                return undefined;
            });

        } else if (this.currentRoom === 2) {
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
                            "<font color='#FF0000'>房间 3/3 - ⚔️ Boss战！击败暗影领主！</font>",
                            this.playerId!, 
                            0
                        );
                        return undefined;
                    });
                }
                return undefined;
            });

        } else if (this.currentRoom === 3) {
            this.OnComplete();
        }
    }

    private OnComplete(): void {
        print("=".repeat(50));
        print("[SimpleDungeon] 🎉 DUNGEON COMPLETE! 🎉");
        print("=".repeat(50));
        
        if (this.playerId !== undefined) {
            LootSystem.GiveCompletionReward(this.playerId, this.currentDifficulty);

            Timers.CreateTimer(5.0, () => {
                const hero = PlayerResource.GetSelectedHeroEntity(this.playerId! );
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

        this.currentRoom = 0;
        this.monsters = [];
    }
}