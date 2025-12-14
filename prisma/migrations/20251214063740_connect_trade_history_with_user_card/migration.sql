-- AddForeignKey
ALTER TABLE "TradeHistory" ADD CONSTRAINT "TradeHistory_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
