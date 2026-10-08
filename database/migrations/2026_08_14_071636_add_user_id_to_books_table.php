<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('books', function (Blueprint $table) {
       // Use `created_by` column instead of `user_id` to match requirements
       if (! Schema::hasColumn('books', 'created_by')) {
           $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('cascade');
       }
   });
}

   /**
    * Reverse the migrations.
    */
   public function down()
{
   Schema::table('books', function (Blueprint $table) {
       if (Schema::hasColumn('books', 'created_by')) {
           $table->dropForeign(['created_by']);
           $table->dropColumn('created_by');
       }
   });
}
};
