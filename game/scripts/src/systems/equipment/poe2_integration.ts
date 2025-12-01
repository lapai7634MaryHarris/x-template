/**
 * POE2 装备系统 - 集成适配器
 * 将 POE2 装备转换为现有仓库系统格式
 */

import { POE2EquipmentInstance, RARITY_COLORS, RARITY_NAMES, EquipSlot } from './poe2_equipment_types';
import { GetBaseTypeById } from './poe2_base_types';
import { GetAffixById } from './poe2_affix_pool';
import { POE2EquipmentGenerator } from './poe2_equipment_generator';
import { EquipmentVaultSystem } from '../equipment_vault_system';
import { LootType, ZoneLootSystem } from '../../zone/zone_loot';

// ⭐ 导入现有系统的接口
import { 
    ExternalRewardItem, 
    ExternalItemType, 
    EquipmentAttribute, 
    EquipmentStat,
    AffixDetail  // ⭐ 新增
} from '../../dungeon/external_reward_pool';

// ==================== POE2 装备转换器 ====================

export class POE2Integration {
    
    /**
     * 将 POE2 装备实例转换为仓库系统格式
     */
    public static ConvertToVaultItem(poe2Item: POE2EquipmentInstance): ExternalRewardItem {
        const baseType = GetBaseTypeById(poe2Item. baseTypeId);
        if (!baseType) {
            print('[POE2Integration] 无法找到基底类型: ' + poe2Item.baseTypeId);
            return {
                name: poe2Item.name,
                type: ExternalItemType.TRINKET,
                icon: 'item_mystery',
                stats: [],
            };
        }

        const slotToTypeMap: Record<EquipSlot, ExternalItemType> = {
            [EquipSlot. WEAPON]: ExternalItemType. WEAPON,
            [EquipSlot.HELMET]: ExternalItemType.HELMET,
            [EquipSlot.  ARMOR]: ExternalItemType.  ARMOR,
            [EquipSlot.GLOVES]: ExternalItemType. TRINKET,
            [EquipSlot.BOOTS]: ExternalItemType.BOOTS,
            [EquipSlot.BELT]: ExternalItemType.BELT,
            [EquipSlot.RING1]: ExternalItemType.RING,
            [EquipSlot.RING2]: ExternalItemType.RING,
            [EquipSlot. AMULET]: ExternalItemType. NECKLACE,
        };

        // 收集所有属性
        const stats: EquipmentStat[] = [];
        const affixDetails: AffixDetail[] = [];  // ⭐ 新增

        // 添加前缀属性和详情
        for (const affix of poe2Item.prefixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const attr = this.AffixTypeToEquipmentAttribute(affix.affixId);
                if (attr) {
                    stats.push({
                        attribute: attr,
                        value: affix.value,
                    });
                }
                
                // ⭐ 添加词缀详情
                const desc = affixDef.description. replace('{value}', affix.value. toString());
                affixDetails. push({
                    position: 'prefix',
                    tier: affix.tier,
                    name: affixDef.name,
                    description: desc,
                    color: '#8888ff',  // 前缀蓝色
                });
            }
        }

        // 添加后缀属性和详情
        for (const affix of poe2Item.suffixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const attr = this.AffixTypeToEquipmentAttribute(affix.affixId);
                if (attr) {
                    stats.push({
                        attribute: attr,
                        value: affix.value,
                    });
                }
                
                // ⭐ 添加词缀详情
                const desc = affixDef.description.replace('{value}', affix.value.toString());
                affixDetails.push({
                    position: 'suffix',
                    tier: affix.tier,
                    name: affixDef. name,
                    description: desc,
                    color: '#ffff77',  // 后缀黄色
                });
            }
        }

        return {
            name: poe2Item.name,
            type: slotToTypeMap[baseType.slot] || ExternalItemType.TRINKET,
            icon: baseType.icon,
            stats: stats,
            rarity: poe2Item.rarity,
            affixDetails: affixDetails,  // ⭐ 添加词缀详情
        };
    }

    private static AffixTypeToEquipmentAttribute(affixType: string): EquipmentAttribute | null {
        const mapping: Record<string, EquipmentAttribute> = {
            'flat_strength': EquipmentAttribute. STRENGTH,
            'flat_agility': EquipmentAttribute. AGILITY,
            'flat_intelligence': EquipmentAttribute.INTELLIGENCE,
            'flat_health': EquipmentAttribute. HEALTH,
            'flat_armor': EquipmentAttribute. ARMOR,
            'flat_mana': EquipmentAttribute. MANA,
            'flat_attack_damage': EquipmentAttribute. ATTACK_DAMAGE,
            'percent_physical_damage': EquipmentAttribute.ATTACK_DAMAGE,
            'percent_attack_speed': EquipmentAttribute. ATTACK_SPEED,
            'percent_max_health': EquipmentAttribute. HEALTH,
            'percent_armor': EquipmentAttribute. ARMOR,
            'percent_move_speed': EquipmentAttribute.MOVE_SPEED,
            'flat_move_speed': EquipmentAttribute.MOVE_SPEED,
            'fire_resistance': EquipmentAttribute.MAGIC_RESISTANCE,
            'cold_resistance': EquipmentAttribute.MAGIC_RESISTANCE,
            'lightning_resistance': EquipmentAttribute.MAGIC_RESISTANCE,
            'crit_chance': EquipmentAttribute.ATTACK_DAMAGE,
            'crit_damage': EquipmentAttribute. ATTACK_DAMAGE,
            'life_leech': EquipmentAttribute.HEALTH,
            'life_regen': EquipmentAttribute. HEALTH,
            'skill_level_all': EquipmentAttribute. INTELLIGENCE,
            'cooldown_reduction': EquipmentAttribute.INTELLIGENCE,
            'evasion_percent': EquipmentAttribute. AGILITY,
        };
        
        return mapping[affixType] || null;
    }

    // ==================== 便捷生成函数 ====================

    public static GenerateAndAddToVault(
        playerId: PlayerID,
        itemLevel: number,
        rarity?: any,
        slot?: EquipSlot
    ): void {
        const poe2Item = POE2EquipmentGenerator.GenerateRandomEquipment(itemLevel, rarity, slot);
        if (!  poe2Item) {
            print('[POE2Integration] 生成装备失败');
            return;
        }

        // ⭐ 添加详细日志
        print('========================================');
        print(`[POE2] 装备详情:`);
        print(`  名称: ${poe2Item.name}`);
        print(`  稀有度: ${RARITY_NAMES[poe2Item.rarity]}`);
        print(`  物品等级: ${poe2Item.itemLevel}`);
        print(`  前缀 (${poe2Item.prefixes. length}):`);
        for (const affix of poe2Item.prefixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const desc = affixDef.description. replace('{value}', affix.value.toString());
                print(`    [T${affix.tier}] ${affixDef.name} - ${desc}`);
            }
        }
        print(`  后缀 (${poe2Item.suffixes.length}):`);
        for (const affix of poe2Item.suffixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const desc = affixDef.description.replace('{value}', affix.value.toString());
                print(`    [T${affix.tier}] ${affixDef.name} - ${desc}`);
            }
        }
        print('========================================');

        // 转换为仓库格式
        const vaultItem = this.ConvertToVaultItem(poe2Item);

        // ⭐ 调试：打印转换后的词缀
        print(`[POE2Integration] 转换后 affixDetails 长度: ${vaultItem.affixDetails?. length || 0}`);

        // 添加到仓库
        EquipmentVaultSystem.SaveToVault(playerId, vaultItem);

        const rarityName = RARITY_NAMES[poe2Item.rarity];
        print(`[POE2Integration] 已添加装备到仓库: ${vaultItem.name} [${rarityName}]`);
    }

    public static GenerateLootDrop(
        playerId: PlayerID,
        itemLevel: number,
        count: number
    ): void {
        for (let i = 0; i < count; i++) {
            this.GenerateAndAddToVault(playerId, itemLevel);
        }
    }

    // ==================== 通货使用集成 ====================

    public static UseChaosOrbOnEquipment(playerId: PlayerID, equipmentIndex: number): boolean {
        print('[POE2Integration] 混沌石功能待实现');
        return false;
    }

    public static UseExaltedOrbOnEquipment(playerId: PlayerID, equipmentIndex: number): boolean {
        print('[POE2Integration] 崇高石功能待实现');
        return false;
    }

    public static UseDivineOrbOnEquipment(playerId: PlayerID, equipmentIndex: number): boolean {
        print('[POE2Integration] 神圣石功能待实现');
        return false;
    }

    public static DisassembleEquipment(playerId: PlayerID, equipmentIndex: number): boolean {
        const scrapCount = RandomInt(1, 3);
        ZoneLootSystem.AddItem(playerId, LootType.POE2_SCRAP, scrapCount);
        print(`[POE2Integration] 分解装备获得 ${scrapCount} 个碎片`);
        return true;
    }
}

// ==================== 测试命令 ====================

if (IsServer()) {
    Timers.CreateTimer(1, () => {
        ListenToGameEvent('player_chat', (event) => {
            const playerId = event.playerid as PlayerID;
            const text = event.text as string;

            if (text === '-poe2test') {
                print(`[POE2Integration] 为玩家 ${playerId} 生成测试装备`);
                POE2Integration.GenerateLootDrop(playerId, 20, 5);
                GameRules.SendCustomMessage(
                    '<font color="#ffd700">✨ 已生成 5 件随机装备到仓库！</font>',
                    playerId,
                    0
                );
            }

            if (text === '-poe2rare') {
                const { ItemRarity } = require('./poe2_equipment_types');
                POE2Integration.GenerateAndAddToVault(playerId, 25, ItemRarity.RARE);
                GameRules.SendCustomMessage(
                    '<font color="#ffff77">⚡ 已生成稀有装备！</font>',
                    playerId,
                    0
                );
            }

            if (text === '-poe2legendary') {
                const { ItemRarity } = require('./poe2_equipment_types');
                POE2Integration.GenerateAndAddToVault(playerId, 30, ItemRarity.LEGENDARY);
                GameRules. SendCustomMessage(
                    '<font color="#ff8800">🔥 已生成传说装备！</font>',
                    playerId,
                    0
                );
            }
        }, null);

        print('========================================');
        print('[POE2Integration] 集成适配器已加载');
        print('[POE2Integration] 测试命令:');
        print('[POE2Integration]   -poe2test (生成5件随机装备)');
        print('[POE2Integration]   -poe2rare (生成稀有装备)');
        print('[POE2Integration]   -poe2legendary (生成传说装备)');
        print('========================================');

        return undefined;
    });
}