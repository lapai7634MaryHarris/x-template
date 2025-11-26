import { ExternalRewardItem } from "../dungeon/external_reward_pool";
// 如果你有 export PlayerID = number，也引入

type PlayerID = number; // 如果没有声明过就在这里补上

export class EquipmentVaultSystem {
    // ✅ PlayerID 用 number 做 key 就不会报错
    private static playerVaults: Record<PlayerID, ExternalRewardItem[]> = {};

    public static SaveToVault(playerId: PlayerID, reward: ExternalRewardItem): void {
        print(`[EquipmentVaultSystem] 保存玩家${playerId}获得的装备：${reward.name}`);
        if (!this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        this.playerVaults[playerId].push(reward);
    }

    public static GetVault(playerId: PlayerID): ExternalRewardItem[] {
        return this.playerVaults[playerId] ?? [];
    }
}