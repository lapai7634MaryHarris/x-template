/**
 * POE2 装备系统 - 初始化和测试命令
 */

import { POE2Integration } from './poe2_integration';
import { ItemRarity } from './poe2_equipment_types';
import { GetAffixById } from './poe2_affix_pool';  // ⭐ 添加这一行
// ==================== 初始化标记 ====================
let initialized = false;

// ==================== 初始化函数 ====================
export function InitPOE2System(): void {
    if (initialized) {
        print('[POE2] 系统已初始化，跳过');
        return;
    }

    print('========================================');
    print('[POE2] 开始初始化 POE2 装备系统');
    print('========================================');

    // 延迟注册命令，确保游戏完全加载
    Timers.CreateTimer(2, () => {
        RegisterPOE2Commands();
        initialized = true;
        print('[POE2] ✓ 初始化完成！');
        print('[POE2] 可用命令: -poe2test, -poe2rare, -poe2legendary, -poe2help');
        return undefined;
    });
}

// ==================== 注册聊天命令 ====================
function RegisterPOE2Commands(): void {
    print('[POE2] 注册聊天命令...');

    ListenToGameEvent('player_chat', (event) => {
        const playerId = event.playerid as PlayerID;
        const text = event.text as string;
if (text === '-poe2stats') {
    print(`[POE2] 玩家 ${playerId} 查看装备统计`);
    
    GameRules.SendCustomMessage(
        '<font color="#00ff00">装备稀有度说明:</font>',
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        '<font color="#c8c8c8">普通（白色）: 0 词缀</font>',
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        '<font color="#8888ff">魔法（蓝色）: 1-2 词缀</font>',
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        '<font color="#ffff77">稀有（黄色）: 4-6 词缀</font>',
        playerId,
        0
    );
    GameRules.SendCustomMessage(
        '<font color="#ff8800">传说（橙色）: 6 词缀（满）</font>',
        playerId,
        0
    );
}
        // ===== -poe2help 显示帮助 =====
        if (text === '-poe2help') {
            GameRules.SendCustomMessage(
                '<font color="#00ff00">========== POE2 装备系统命令 ==========</font>',
                playerId,
                0
            );
            GameRules.SendCustomMessage(
                '<font color="#ffff00">-poe2test</font> - 生成 5 件随机装备',
                playerId,
                0
            );
            GameRules.SendCustomMessage(
                '<font color="#ffff00">-poe2rare</font> - 生成 1 件稀有装备',
                playerId,
                0
            );
            GameRules.SendCustomMessage(
                '<font color="#ffff00">-poe2legendary</font> - 生成 1 件传说装备',
                playerId,
                0
            );
            GameRules.SendCustomMessage(
                '<font color="#ffff00">-poe2status</font> - 查看系统状态',
                playerId,
                0
            );
            print(`[POE2] 玩家 ${playerId} 查看了帮助`);
        }

        // ===== -poe2status 系统状态 =====
        if (text === '-poe2status') {
            GameRules.SendCustomMessage(
                '<font color="#00ff00">✓ POE2 装备系统状态: 运行中</font>',
                playerId,
                0
            );
            GameRules.SendCustomMessage(
                '<font color="#00ffff">基底类型: 45 种 | 词缀类型: 20 种</font>',
                playerId,
                0
            );
            GameRules.SendCustomMessage(
                '<font color="#00ffff">稀有度: 普通/魔法/稀有/传说</font>',
                playerId,
                0
            );
            print(`[POE2] 系统状态检查 - 玩家 ${playerId}`);
        }

        // ===== -poe2test 生成5件随机装备 =====
        if (text === '-poe2test') {
            print(`[POE2] 玩家 ${playerId} 使用 -poe2test 命令`);
            
            try {
                POE2Integration.GenerateLootDrop(playerId, 20, 5);
                
                GameRules.SendCustomMessage(
                    '<font color="#ffd700">✨ 已生成 5 件随机装备到仓库！</font>',
                    playerId,
                    0
                );
                GameRules.SendCustomMessage(
                    '<font color="#ffff00">按 B 键打开仓库查看</font>',
                    playerId,
                    0
                );
                print(`[POE2] ✓ 成功为玩家 ${playerId} 生成装备`);
            } catch (error) {
                print(`[POE2] ❌ 生成装备失败: ${error}`);
                GameRules.SendCustomMessage(
                    '<font color="#ff0000">❌ 生成装备失败，请查看日志</font>',
                    playerId,
                    0
                );
            }
        }

        // ===== -poe2rare 生成稀有装备 =====
        if (text === '-poe2rare') {
            print(`[POE2] 玩家 ${playerId} 使用 -poe2rare 命令`);
            
            try {
                POE2Integration.GenerateAndAddToVault(playerId, 25, ItemRarity. RARE);
                
                GameRules.SendCustomMessage(
                    '<font color="#ffff77">⚡ 已生成稀有装备到仓库！</font>',
                    playerId,
                    0
                );
                print(`[POE2] ✓ 成功为玩家 ${playerId} 生成稀有装备`);
            } catch (error) {
                print(`[POE2] ❌ 生成稀有装备失败: ${error}`);
                GameRules.SendCustomMessage(
                    '<font color="#ff0000">❌ 生成失败</font>',
                    playerId,
                    0
                );
            }
        }

        // ===== -poe2legendary 生成传说装备 =====
        if (text === '-poe2legendary') {
            print(`[POE2] 玩家 ${playerId} 使用 -poe2legendary 命令`);
            
            try {
                POE2Integration.GenerateAndAddToVault(playerId, 30, ItemRarity.LEGENDARY);
                
                GameRules. SendCustomMessage(
                    '<font color="#ff8800">🔥 已生成传说装备到仓库！</font>',
                    playerId,
                    0
                );
                print(`[POE2] ✓ 成功为玩家 ${playerId} 生成传说装备`);
            } catch (error) {
                print(`[POE2] ❌ 生成传说装备失败: ${error}`);
                GameRules.SendCustomMessage(
                    '<font color="#ff0000">❌ 生成失败</font>',
                    playerId,
                    0
                );
            }
        }
    }, null);

    print('[POE2] ✓ 聊天命令已注册');
}

