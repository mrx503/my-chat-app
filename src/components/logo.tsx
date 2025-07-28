import Image from 'next/image';
import { cn } from '@/lib/utils';

const Logo = ({ className }: { className?: string }) => (
  <Image
    src="https://i.postimg.cc/tCYrZpnd/duck.jpg"
    alt="duck logo"
    width={32}
    height={32}
    className={cn('rounded-full', className)}
    priority // Ensures the logo loads quickly
  />
);

export default Logo;
