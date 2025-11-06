import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export class Post extends Model {
  static table = 'posts';

  @field('title') title;
  @field('body') body;
  @date('created_at') createdAt;

  async updatePost(newTitle, newBody) {
    await this.update(post => {
      post.title = newTitle;
      post.body = newBody;
    });
  }

  async deletePost() {
    await this.markAsDeleted();
    await this.destroyPermanently();
  }
}
