import { CardHistory } from "@/components/ui/cardHistory";

export default function HistoryContents() {
    return (
        <div className="h-full w-full rounded-md shadow-lg shadow-gray-300">
            <CardHistory
                time="10:30 AM"
                date="Nov 24, 2025"
                description="Payment received from Client A"
                imageUrl="https://github.com/shadcn.png"
            />
        </div>
    );
}
