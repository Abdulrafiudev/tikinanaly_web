import { useLocation } from "react-router-dom";
import Button from "@/components/ui/Button";
import categories from "@/data/categoryList";

type CategoryItem = {
  label: string;
  href: string;
};

export const Category = () => {
  const { pathname } = useLocation();

  return (
    <div
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div className="flex hide-scrollbar dark:bg-[#0D1117] w-full gap-2 overflow-x-auto overflow-y-hidden page-padding-x pb-1">
        {categories.map((cat: CategoryItem) => {
          const isActive = pathname === cat.href;

          return (
            <Button
              key={cat.label}
              label={cat.label}
              href={cat.href}
              variant={isActive ? "primary" : "outline"}
              className="font sz-8 md:font-[600]"
            />
          );
        })}
      </div>
    </div>
  );
};

export default Category;
