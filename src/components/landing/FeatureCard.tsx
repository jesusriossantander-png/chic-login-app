import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
};

export function FeatureCard({ title, description, icon: Icon, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Card className="h-full rounded-[1.35rem] border-black/10 bg-white shadow-[0_22px_60px_-42px_rgba(17,24,39,0.6)] transition-shadow hover:shadow-[0_28px_70px_-44px_rgba(15,122,69,0.72)]">
        <CardHeader className="space-y-4 p-5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0F7A45]/8 text-[#0F7A45]">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg font-semibold leading-tight tracking-normal text-[#111827]">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <p className="text-[15px] leading-7 text-[#667085]">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
