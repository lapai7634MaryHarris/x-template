import React, { useEffect, useState } from 'react';
// 暂时注释掉 less 引入
// import './rage_bar.less';

interface RageData {
    current: number;
    max: number;
}

export const RageBar: React.FC = () => {
    const [rage, setRage] = useState<RageData>({ current: 0, max: 100 });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // @ts-ignore
        const rageUpdateListener = GameEvents.Subscribe('rage_updated', (data: RageData) => {
            setRage(data);
            setVisible(true);
        });

        // @ts-ignore
        const rageInsufficientListener = GameEvents.Subscribe('rage_insufficient', () => {
            const panel = $.GetContextPanel();
            if (panel) {
                panel.AddClass('insufficient');
                $.Schedule(0.5, () => {
                    panel.RemoveClass('insufficient');
                });
            }
        });

        return () => {
            GameEvents.Unsubscribe(rageUpdateListener);
            GameEvents.Unsubscribe(rageInsufficientListener);
        };
    }, []);

    if (!visible) {
        return null;
    }

    const percentage = (rage.current / rage.max) * 100;

    return (
        <Panel className="rage-bar-container">
            <Panel className="rage-bar-bg">
                <Panel 
                    className="rage-bar-fill" 
                    style={{ width: `${percentage}%` }}
                />
            </Panel>
            <Label className="rage-text" text={`怒气: ${rage.current} / ${rage.max}`} />
        </Panel>
    );
};