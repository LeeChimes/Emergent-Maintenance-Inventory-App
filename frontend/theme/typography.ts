export const typography = {
  xs:12, sm:14, md:16, lg:18, xl:22, xxl:28,
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  lh: (size:number) => Math.round(size * 1.4),
};