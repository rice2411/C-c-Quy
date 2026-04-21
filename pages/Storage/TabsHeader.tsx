import React, { useMemo } from 'react';
import Tabs, { TabsItem } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { RouteConfig } from '@/config/routes';
import Badge from '@/components/ui/Badge';

interface TabsHeaderProps {
  tabs: RouteConfig[];
  activeTab: string;
  onChange: (tab: string) => void;
}

const TabsHeader: React.FC<TabsHeaderProps> = ({ tabs, activeTab, onChange }) => {
  const { t } = useLanguage();

  const tabItems = useMemo<TabsItem[]>(() => {
    return tabs.map((tab) => {
      const tabId = tab.tabId || '';
      const isDisabled = Boolean(tab.disabled);
      return {
        id: tabId,
        label: t(tab.labelKey),
        disabled: isDisabled,
        badge: isDisabled ? (
          <Badge
            size="sm"
            layoutClassName="ml-1 px-1 py-0.5 text-[10px] font-bold normal-case"
            borderClassName="border-transparent"
            backgroundClassName="bg-amber-100 dark:bg-amber-900/40"
            textClassName="text-amber-700 dark:text-amber-300"
          >
            Bảo trì
          </Badge>
        ) : undefined
      };
    });
  }, [tabs, t]);

  return <Tabs items={tabItems} value={activeTab} onChange={onChange} />;
};

export default TabsHeader;

