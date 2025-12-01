/**
 * 角色属性请求处理
 * 只显示装备的全局属性，不包含护石（护石是针对技能的）
 */

export function InitCharacterStatsHandler(): void {
    print('[CharacterStatsHandler] 初始化角色属性请求处理');
    
    CustomGameEventManager.RegisterListener('request_character_stats', (_, data: any) => {
        const playerId = data. PlayerID as PlayerID;
        
        print('[CharacterStatsHandler] 收到角色属性请求: ' + playerId);
        
        const stats = {
            increasedDamage: 0,
            increasedPhysicalDamage: 0,
            increasedElementalDamage: 0,
            increasedFireDamage: 0,
            increasedColdDamage: 0,
            increasedLightningDamage: 0,
            moreDamageValues: [] as number[],
            critChance: 5,
            critMultiplier: 150,
            projectileDamage: 0,
            areaDamage: 0,
            meleeDamage: 0,
            spellDamage: 0,
            attackDamage: 0,
            dotDamage: 0,
            cooldownReduction: 0,
            areaOfEffect: 0,
            attackSpeed: 0,
            castSpeed: 0,
            lifesteal: 0,
        };
        
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            (CustomGameEventManager.Send_ServerToPlayer as any)(
                player,
                'update_character_stats',
                stats
            );
            print('[CharacterStatsHandler] 发送角色属性数据完成');
        }
    });
}