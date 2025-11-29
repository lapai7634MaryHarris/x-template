/**
 * 技能点系统
 */

export interface SkillDefinition {
    id: string;
    name: string;
    maxLevel: number;
    unlockLevel: number;
    prerequisite?: string;
    prerequisiteLevel?: number;
    implemented: boolean;
}

export const WARRIOR_SKILLS: SkillDefinition[] = [
    { id: 'warrior_deep_wound', name: '重伤', maxLevel: 1, unlockLevel: 1, implemented: true },
    { id: 'warrior_thunder_strike', name: '雷霆一击', maxLevel: 5, unlockLevel: 1, implemented: true },
    { id: 'warrior_sudden_death', name: '猝死', maxLevel: 5, unlockLevel: 5, prerequisite: 'warrior_thunder_strike', prerequisiteLevel: 1, implemented: true },
    { id: 'warrior_execute', name: '斩杀', maxLevel: 1, unlockLevel: 10, implemented: true },
    { id: 'warrior_strike', name: '猛击', maxLevel: 5, unlockLevel: 1, implemented: false },
    { id: 'warrior_whirlwind', name: '旋风斩', maxLevel: 5, unlockLevel: 5, prerequisite: 'warrior_strike', prerequisiteLevel: 3, implemented: false },
    { id: 'warrior_warcry', name: '战吼', maxLevel: 5, unlockLevel: 3, implemented: false },
    { id: 'warrior_berserker', name: '狂战士', maxLevel: 5, unlockLevel: 8, prerequisite: 'warrior_warcry', prerequisiteLevel: 2, implemented: false },
    { id: 'warrior_bloodthirst', name: '嗜血', maxLevel: 5, unlockLevel: 5, implemented: false },
    { id: 'warrior_armor_break', name: '破甲', maxLevel: 5, unlockLevel: 6, implemented: false },
    { id: 'warrior_charge', name: '冲锋', maxLevel: 5, unlockLevel: 4, implemented: false },
    { id: 'warrior_block', name: '格挡', maxLevel: 5, unlockLevel: 3, implemented: false },
    { id: 'warrior_tenacity', name: '坚韧', maxLevel: 5, unlockLevel: 2, implemented: false },
    { id: 'warrior_critical', name: '致命打击', maxLevel: 5, unlockLevel: 7, prerequisite: 'warrior_tenacity', prerequisiteLevel: 3, implemented: false },
    { id: 'warrior_avatar', name: '战神降临', maxLevel: 3, unlockLevel: 15, prerequisite: 'warrior_berserker', prerequisiteLevel: 3, implemented: false },
];

interface PlayerSkillData {
    totalSkillPoints: number;
    usedSkillPoints: number;
    skillLevels: Record<string, number>;
    lastSentLevel: number;
}

class SkillPointSystemClass {
    private playerData: Map<PlayerID, PlayerSkillData> = new Map();
    private initialized: boolean = false;

    public Init(): void {
        if (this.initialized) return;
        
        print('[SkillPointSystem] ========================================');
        print('[SkillPointSystem] 初始化技能点系统');
        print('[SkillPointSystem] ========================================');

        ListenToGameEvent('dota_player_gained_level', (event) => {
            const playerId = event.player_id as PlayerID;
            const newLevel = event.level;
            print('[SkillPointSystem] 玩家 ' + playerId + ' 升级到 ' + newLevel);
            this.onPlayerLevelUp(playerId, newLevel);
        }, this);

        CustomGameEventManager.RegisterListener('skill_point_request_data', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            print('[SkillPointSystem] 收到数据请求，玩家: ' + playerId);
            this.sendDataToClient(playerId);
        });

        CustomGameEventManager.RegisterListener('skill_point_upgrade_skill', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const skillId = data.skillId as string;
            print('[SkillPointSystem] 收到升级请求，玩家: ' + playerId + ', 技能: ' + skillId);
            this.upgradeSkill(playerId, skillId);
        });

        CustomGameEventManager.RegisterListener('skill_point_reset', (_, data: any) => {
            const playerId = data. PlayerID as PlayerID;
            print('[SkillPointSystem] 收到重置请求，玩家: ' + playerId);
            this.resetSkills(playerId);
        });

        this.initialized = true;
        print('[SkillPointSystem] 初始化完成');
    }

    public initPlayer(playerId: PlayerID): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        const currentLevel = hero ? hero.GetLevel() : 1;
        
        let totalPoints = 0;
        for (let i = 1; i <= currentLevel; i++) {
            totalPoints += this. calculateSkillPointsForLevel(i);
        }

        this.playerData.set(playerId, {
            totalSkillPoints: totalPoints,
            usedSkillPoints: 0,
            skillLevels: {},
            lastSentLevel: currentLevel,
        });
        
        print('[SkillPointSystem] 初始化玩家 ' + playerId + '，等级 ' + currentLevel + '，技能点 ' + totalPoints);
        
        this.sendDataToClient(playerId);
    }

    private calculateSkillPointsForLevel(level: number): number {
        let points = 1;
        if (level > 1 && level % 5 === 0) {
            points += 3;
        }
        return points;
    }

    private onPlayerLevelUp(playerId: PlayerID, newLevel: number): void {
        let data = this.playerData.get(playerId);
        
        if (!data) {
            print('[SkillPointSystem] 玩家 ' + playerId + ' 数据不存在，初始化.. .');
            this.initPlayer(playerId);
            return;
        }

        const lastLevel = data.lastSentLevel || 1;
        let pointsGained = 0;
        
        for (let i = lastLevel + 1; i <= newLevel; i++) {
            pointsGained += this.calculateSkillPointsForLevel(i);
        }

        if (pointsGained > 0) {
            data.totalSkillPoints += pointsGained;
            data.lastSentLevel = newLevel;
            
            print('[SkillPointSystem] 玩家 ' + playerId + ' 获得 ' + pointsGained + ' 技能点，总计: ' + data.totalSkillPoints);
            
            this.sendDataToClient(playerId);
        }
    }

    public getAvailablePoints(playerId: PlayerID): number {
        const data = this. playerData.get(playerId);
        if (!data) return 0;
        return data.totalSkillPoints - data.usedSkillPoints;
    }

    public getSkillLevel(playerId: PlayerID, skillId: string): number {
        const data = this.playerData. get(playerId);
        if (!data) return 0;
        return data.skillLevels[skillId] || 0;
    }

    public canUpgradeSkill(playerId: PlayerID, skillId: string): { canUpgrade: boolean; reason?: string } {
        const data = this.playerData.get(playerId);
        if (!data) return { canUpgrade: false, reason: '玩家数据不存在' };

        const skill = WARRIOR_SKILLS.find(s => s.id === skillId);
        if (!skill) return { canUpgrade: false, reason: '技能不存在' };
        if (! skill.implemented) return { canUpgrade: false, reason: '技能开发中' };

        const availablePoints = this.getAvailablePoints(playerId);
        if (availablePoints <= 0) return { canUpgrade: false, reason: '技能点不足' };

        const currentLevel = this.getSkillLevel(playerId, skillId);
        if (currentLevel >= skill.maxLevel) return { canUpgrade: false, reason: '技能已满级' };

        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
            const playerLevel = hero.GetLevel();
            if (playerLevel < skill.unlockLevel) {
                return { canUpgrade: false, reason: '需要等级 ' + skill.unlockLevel };
            }
        }

        if (skill.prerequisite) {
            const prereqLevel = this.getSkillLevel(playerId, skill.prerequisite);
            const requiredLevel = skill.prerequisiteLevel || 1;
            if (prereqLevel < requiredLevel) {
                const prereqSkill = WARRIOR_SKILLS.find(s => s.id === skill.prerequisite);
                return { canUpgrade: false, reason: '需要 ' + (prereqSkill?.name || skill.prerequisite) + ' 等级 ' + requiredLevel };
            }
        }

        return { canUpgrade: true };
    }

    public upgradeSkill(playerId: PlayerID, skillId: string): boolean {
        const checkResult = this.canUpgradeSkill(playerId, skillId);
        if (!checkResult. canUpgrade) {
            print('[SkillPointSystem] 无法升级: ' + checkResult.reason);
            this.sendError(playerId, checkResult.reason || '无法升级');
            return false;
        }

        const data = this.playerData.get(playerId)!;
        const skill = WARRIOR_SKILLS.find(s => s.id === skillId)!;

        data.skillLevels[skillId] = (data.skillLevels[skillId] || 0) + 1;
        data.usedSkillPoints += 1;

        print('[SkillPointSystem] 玩家 ' + playerId + ' 升级 ' + skill.name + ' 到 ' + data.skillLevels[skillId] + ' 级');

        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
            const ability = hero.FindAbilityByName(skillId);
            if (ability) {
                ability.SetLevel(data.skillLevels[skillId]);
                print('[SkillPointSystem] 设置英雄技能 ' + skillId + ' 等级为 ' + data.skillLevels[skillId]);
            }
        }

        this.sendDataToClient(playerId);
        return true;
    }

    public resetSkills(playerId: PlayerID): void {
        const data = this. playerData.get(playerId);
        if (!data) return;

        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
            for (const skillId of Object.keys(data.skillLevels)) {
                const ability = hero.FindAbilityByName(skillId);
                if (ability) {
                    ability.SetLevel(0);
                }
            }
        }

        data.skillLevels = {};
        data.usedSkillPoints = 0;

        print('[SkillPointSystem] 玩家 ' + playerId + ' 重置技能树');
        this.sendDataToClient(playerId);
    }

    public sendDataToClient(playerId: PlayerID): void {
        const data = this.playerData.get(playerId);
        const player = PlayerResource.GetPlayer(playerId);
        
        if (!player) {
            print('[SkillPointSystem] 找不到玩家 ' + playerId);
            return;
        }

        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        const playerLevel = hero ?  hero.GetLevel() : 1;

        const availablePoints = data ?  (data.totalSkillPoints - data.usedSkillPoints) : 0;

        // ⭐ 移除 JSON.stringify，使用简单的日志
        print('[SkillPointSystem] 发送数据: 可用点数=' + availablePoints + ', 等级=' + playerLevel);

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            'skill_point_data_update' as never,
            {
                totalPoints: data ? data.totalSkillPoints : 0,
                usedPoints: data ? data.usedSkillPoints : 0,
                availablePoints: availablePoints,
                skillLevels: data ?  data.skillLevels : {},
                playerLevel: playerLevel,
            } as never
        );
    }

    private sendError(playerId: PlayerID, message: string): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (! player) return;

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            'skill_point_error' as never,
            { message: message } as never
        );
    }
}

// 导出单例实例
export const SkillPointSystem = new SkillPointSystemClass();

// 初始化函数
export function InitSkillPointSystem(): void {
    SkillPointSystem.Init();
}